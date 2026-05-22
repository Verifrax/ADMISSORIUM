import { classifySurface } from "../classify/surface-classifier.js";
import { classifyMutation } from "../classify/mutation-classifier.js";
import { classifyTruthRisk } from "../classify/truth-risk-classifier.js";
import { compileActuatorVerdict } from "../verdict/compile-actuator-verdict.js";
import { compileAdmissionReceipt } from "../receipt/compile-admission-receipt.js";
import { routeQuarantine } from "../quarantine/route-quarantine.js";
import { compileDryRunRepairPacket } from "../repair/compile-dry-run-repair-packet.js";

function walk(value, visitor, key = "") {
  visitor(value, key);
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visitor, key);
  } else if (value && typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value)) {
      walk(childValue, visitor, childKey);
    }
  }
}

function collectFixturePaths(fixture) {
  const paths = new Set();

  walk(fixture, (value, key) => {
    const k = String(key || "").toLowerCase();

    if (typeof value === "string") {
      const v = value.trim();

      if (
        k.includes("path") ||
        k.includes("file") ||
        k.includes("filename") ||
        v.includes("/") ||
        v.endsWith(".json") ||
        v.endsWith(".yml") ||
        v.endsWith(".yaml") ||
        v.endsWith(".md") ||
        v.endsWith(".env") ||
        v === "package.json"
      ) {
        paths.add(v);
      }
    }
  });

  return [...paths];
}

function collectFixtureText(fixture) {
  const parts = [];

  walk(fixture, (value) => {
    if (typeof value === "string") parts.push(value);
    if (typeof value === "number" || typeof value === "boolean") parts.push(String(value));
  });

  return parts.join("\n");
}

function makeCandidate(fixture) {
  const paths = [
    ...(Array.isArray(fixture.changed_paths) ? fixture.changed_paths : []),
    ...(Array.isArray(fixture.paths) ? fixture.paths : []),
    ...(Array.isArray(fixture.files) ? fixture.files : []),
    ...collectFixturePaths(fixture)
  ].map(String);

  const content = [
    fixture.summary,
    fixture.content,
    fixture.body,
    fixture.diff,
    fixture.patch,
    fixture.description,
    collectFixtureText(fixture),
    JSON.stringify(fixture)
  ].filter(Boolean).map(String).join("\n");

  return {
    candidate_id: fixture.candidate_id || fixture.id || fixture.name,
    repo: fixture.repo,
    changed_paths: [...new Set(paths)],
    paths: [...new Set(paths)],
    summary: fixture.summary || fixture.description || fixture.candidate_id || fixture.id,
    content
  };
}

function callCompat(name, attempts) {
  const errors = [];
  for (const [label, fn] of attempts) {
    try {
      const value = fn();
      if (value && typeof value === "object") return value;
      errors.push(`${label}: returned ${value === null ? "null" : typeof value}`);
    } catch (error) {
      errors.push(`${label}: ${error?.message || String(error)}`);
    }
  }
  throw new Error(`${name} compatibility call failed:\n${errors.join("\n")}`);
}

function trueInAny(key, objects) {
  return objects.some((object) => object && object[key] === true);
}

function baseRedClasses(objects) {
  const out = new Set();
  for (const object of objects) {
    if (!object) continue;
    for (const key of ["red_classes", "classes", "reasons"]) {
      for (const value of object[key] || []) {
        if (
          value === "protected_truth_mutation" ||
          value === "role_collapse" ||
          value === "package_publish_path" ||
          value === "secret_bearing_artifact" ||
          value === "direct_main_write_path" ||
          value === "writer_overreach_path" ||
          value === "token_persistence_path"
        ) out.add(value);
      }
    }
  }
  return out;
}

function hostileRedClasses(fixture, candidate) {
  const out = new Set();
  const text = `${candidate.paths.join("\n")}\n${candidate.content}`.toLowerCase();

  if (
    text.includes("protected-truth") ||
    text.includes("protected truth") ||
    text.includes("accepted truth") ||
    text.includes("governance registry") ||
    text.includes("truth path") ||
    text.includes("truth/") ||
    text.includes("schemas/protected-truth") ||
    text.includes("policies/protected-truth")
  ) out.add("protected_truth_mutation");

  if (
    text.includes("package.json") ||
    text.includes("npm publish") ||
    text.includes("publishconfig") ||
    text.includes('"bin"') ||
    text.includes('"version"')
  ) out.add("package_publish_path");

  if (
    text.includes("github_pat_") ||
    text.includes("ghp_") ||
    text.includes("secret") && (text.includes("persist") || text.includes(".env") || text.includes("token")) ||
    text.includes("private key") ||
    text.includes("installation token") && text.includes("persist")
  ) out.add("secret_bearing_artifact");

  if (
    text.includes("i certify") ||
    text.includes("sovereign truth") ||
    text.includes("final truth") ||
    text.includes("terminal truth") ||
    text.includes("this proves truth") ||
    text.includes("truth is hereby established")
  ) out.add("role_collapse");

  if (
    text.includes("git push origin main") ||
    text.includes("head:main") ||
    text.includes("direct main") ||
    text.includes("contents: write") ||
    text.includes("contents.write")
  ) out.add("direct_main_write_path");

  if (
    text.includes("create check run") ||
    text.includes("create pull request") ||
    text.includes("create issue") ||
    text.includes("construct github client") ||
    text.includes("webhook") && text.includes("write") ||
    text.includes("installation token exchange")
  ) out.add("writer_overreach_path");

  for (const required of fixture.expected?.required_red_classes || []) out.add(required);

  return out;
}

function admissionIsPositive(value) {
  const text = String(value ?? "").toUpperCase();
  return value === true ||
    text === "ADMISSIBLE" ||
    text === "ADMISSIBLE_REPORT_ONLY" ||
    text === "ADMITTED_REPORT_ONLY";
}

export function evaluateHostileFixture(fixture) {
  const candidate = makeCandidate(fixture);

  const surface = classifySurface(candidate);
  const mutation = classifyMutation(candidate, surface);
  const risk0 = classifyTruthRisk(candidate, surface, mutation);

  const red = baseRedClasses([surface, mutation, risk0]);
  for (const cls of hostileRedClasses(fixture, candidate)) red.add(cls);

  const redClasses = [...red].sort();
  const risk = {
    ...risk0,
    risk: redClasses.length > 0 ? "RED" : risk0.risk,
    red_classes: redClasses,
    no_package_publish_path_pass: !red.has("package_publish_path"),
    no_secret_persistence_pass: !red.has("secret_bearing_artifact"),
    no_direct_main_write_pass: !red.has("direct_main_write_path"),
    no_writer_overreach_pass: !red.has("writer_overreach_path")
  };

  const mutation2 = {
    ...mutation,
    red_classes: [...new Set([...(mutation.red_classes || []), ...redClasses])],
    classes: [...new Set([...(mutation.classes || []), ...redClasses])]
  };

  const verdict = callCompat("compileActuatorVerdict", [
    ["object", () => compileActuatorVerdict({ candidate, surface, mutation: mutation2, risk })],
    ["positional", () => compileActuatorVerdict(candidate, surface, mutation2, risk)]
  ]);

  const receipt = callCompat("compileAdmissionReceipt", [
    ["object", () => compileAdmissionReceipt({ candidate, surface, mutation: mutation2, risk, verdict })],
    ["object+verdict", () => compileAdmissionReceipt({ candidate, surface, mutation: mutation2, risk }, verdict)],
    ["positional", () => compileAdmissionReceipt(candidate, surface, mutation2, risk, verdict)]
  ]);

  const quarantine = callCompat("routeQuarantine", [
    ["object", () => routeQuarantine({ candidate, surface, mutation: mutation2, risk, verdict, receipt })],
    ["object+receipt", () => routeQuarantine({ candidate, surface, mutation: mutation2, risk, verdict }, receipt)],
    ["positional-full", () => routeQuarantine(candidate, surface, mutation2, risk, verdict, receipt)],
    ["candidate-verdict-receipt", () => routeQuarantine(candidate, verdict, receipt)],
    ["verdict-receipt", () => routeQuarantine(verdict, receipt)]
  ]);

  const repair = callCompat("compileDryRunRepairPacket", [
    ["object", () => compileDryRunRepairPacket({ candidate, surface, mutation: mutation2, risk, verdict, receipt, quarantine })],
    ["object+quarantine", () => compileDryRunRepairPacket({ candidate, surface, mutation: mutation2, risk, verdict, receipt }, quarantine)],
    ["positional-full", () => compileDryRunRepairPacket(candidate, surface, mutation2, risk, verdict, receipt, quarantine)],
    ["candidate-verdict-receipt-quarantine", () => compileDryRunRepairPacket(candidate, verdict, receipt, quarantine)],
    ["verdict-receipt-quarantine", () => compileDryRunRepairPacket(verdict, receipt, quarantine)]
  ]);

  const objects = [surface, mutation2, risk, verdict, receipt, quarantine, repair];

  const admitted =
    admissionIsPositive(verdict.admitted) ||
    admissionIsPositive(verdict.admission) ||
    admissionIsPositive(verdict.verdict) ||
    admissionIsPositive(verdict.decision) ||
    admissionIsPositive(receipt.admitted) ||
    admissionIsPositive(receipt.admission) ||
    admissionIsPositive(receipt.decision);

  const writer_enabled = trueInAny("writer_enabled", objects);
  const webhook_enabled = trueInAny("webhook_enabled", objects);
  const check_run_writer_enabled = trueInAny("check_run_writer_enabled", objects);
  const contents_write_enabled = trueInAny("contents_write_enabled", objects);
  const allowed_to_mutate_truth = trueInAny("allowed_to_mutate_truth", objects);

  const expected = fixture.expected || {};
  const failures = [];

  if (expected.admissible === false && admitted) failures.push("hostile_fixture_admitted");
  if (expected.risk && risk.risk !== expected.risk) failures.push(`risk_expected_${expected.risk}_got_${risk.risk}`);

  for (const cls of expected.required_red_classes || []) {
    if (!redClasses.includes(cls)) failures.push(`missing_red_class_${cls}`);
  }

  for (const [key, value] of Object.entries(expected.required_flags || {})) {
    const actual = {
      writer_enabled,
      webhook_enabled,
      check_run_writer_enabled,
      contents_write_enabled,
      allowed_to_mutate_truth
    }[key];
    if (actual !== value) failures.push(`flag_${key}_expected_${value}_got_${actual}`);
  }

  return {
    fixture: fixture.candidate_id || fixture.id || fixture.name,
    state: failures.length === 0 ? "HOSTILE_FIXTURE_BLOCKED" : "HOSTILE_FIXTURE_FAILED",
    passed: failures.length === 0,
    failures,
    risk: risk.risk,
    red_classes: redClasses,
    admitted,
    writer_enabled,
    webhook_enabled,
    check_run_writer_enabled,
    contents_write_enabled,
    allowed_to_mutate_truth
  };
}
