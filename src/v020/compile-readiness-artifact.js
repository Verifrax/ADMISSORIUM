import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

const ROOT = process.cwd();

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function runGate(id, command, token) {
  const output = execSync(command, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  const passed = output.includes(token);
  return {
    id,
    command,
    expected_token: token,
    passed,
    writer_enabled: false,
    network_required: false,
    token_persistence_enabled: false,
    operational_writer_enabled: false
  };
}

function assertFileGate(id, filePath, token) {
  const absolute = path.join(ROOT, filePath);
  const exists = fs.existsSync(absolute);
  const text = exists ? fs.readFileSync(absolute, "utf8") : "";
  const passed = exists && text.includes(token);

  return {
    id,
    file: filePath,
    expected_token: token,
    passed,
    writer_enabled: false,
    network_required: false,
    token_persistence_enabled: false,
    operational_writer_enabled: false
  };
}

const gates = [
  runGate("schema_validation", "npm run v020:schema:validate", "ADMISSORIUM_V020_OBJECT_SCHEMAS_PASS=true"),
  runGate("classifier_comparator", "npm run v020:classify", "ADMISSORIUM_V020_CLASSIFIER_COMPARATOR_PASS=true"),
  runGate("actuator_verdict_receipt", "npm run v020:verdict", "ADMISSORIUM_V020_ACTUATOR_VERDICT_RECEIPT_PASS=true"),
  runGate("quarantine_repair", "npm run v020:quarantine", "ADMISSORIUM_V020_QUARANTINE_REPAIR_PASS=true"),
  runGate("operator_review_bundle", "npm run v020:operator-review", "ADMISSORIUM_V020_OPERATOR_REVIEW_BUNDLE_PASS=true"),
  runGate("test_mode_writer_simulation", "npm run v020:writer-sim", "ADMISSORIUM_V020_TEST_MODE_WRITER_SIMULATION_PASS=true"),
  runGate("webhook_signature_verification", "npm run v020:webhook", "ADMISSORIUM_V020_WEBHOOK_SIGNATURE_VERIFICATION_PASS=true"),
  runGate("hostile_fixture_battery", "npm run v020:hostile", "ADMISSORIUM_V020_HOSTILE_FIXTURES_PASS=true"),
  assertFileGate(
    "report_writers_history_binding",
    "reports/current/admissorium-v020-report-bundle.json",
    "ADMISSORIUM_V020_REPORT_BUNDLE_PASS"
  )
];

const failed = gates.filter((gate) => !gate.passed);

const payload = {
  artifact: "ADMISSORIUM_V020_READINESS_ARTIFACT",
  schema_version: "0.2.0",
  state: failed.length === 0
    ? "ADMISSORIUM_V020_READINESS_ARTIFACT_PASS"
    : "ADMISSORIUM_V020_READINESS_ARTIFACT_FAIL",
  truth_warning: "NOT_TRUTH_SOURCE",
  completion_claim: false,
  readiness_scope: "report-only sealed admissibility control plane",
  ready_for: [
    "operator review",
    "report writers",
    "history-bound local readiness evidence"
  ],
  not_ready_for: [
    "real GitHub writer",
    "check-run writer",
    "pull-request writer",
    "issue writer",
    "package publish",
    "repository content mutation",
    "protected truth mutation",
    "VERIFRAX system completion claim"
  ],
  writer_enabled: false,
  webhook_runtime_enabled: false,
  check_run_writer_enabled: false,
  pull_request_writer_enabled: false,
  issue_writer_enabled: false,
  package_publish_enabled: false,
  contents_write_enabled: false,
  operational_writer_enabled: false,
  network_required: false,
  token_persistence_enabled: false,
  allowed_to_mutate_truth: false,
  gates,
  totals: {
    total_gates: gates.length,
    passed_gates: gates.filter((gate) => gate.passed).length,
    failed_gates: failed.length
  }
};

const payloadHash = sha256(stable(payload));
const artifact = {
  ...payload,
  payload_hash_sha256: payloadHash,
  local_signature: {
    algorithm: "sha256-local-deterministic-readiness-seal",
    production_signature: false,
    signature: sha256(`ADMISSORIUM_V020_READINESS_ARTIFACT::${payloadHash}`)
  }
};

fs.mkdirSync(path.join(ROOT, "reports/current"), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, "reports/current/admissorium-v020-readiness.json"),
  `${JSON.stringify(artifact, null, 2)}\n`
);

const stamp = new Date().toISOString().replaceAll(":", "-").replace(".", "-");
const historyDir = path.join(ROOT, `reports/history/admissorium-v020-readiness-${stamp}`);
fs.mkdirSync(historyDir, { recursive: true });
fs.writeFileSync(
  path.join(historyDir, "admissorium-v020-readiness.json"),
  `${JSON.stringify(artifact, null, 2)}\n`
);
fs.writeFileSync(
  path.join(historyDir, "manifest.json"),
  `${JSON.stringify({
    artifact: "ADMISSORIUM_V020_READINESS_ARTIFACT",
    current: "reports/current/admissorium-v020-readiness.json",
    history_snapshot: path.relative(ROOT, historyDir),
    payload_hash_sha256: payloadHash,
    completion_claim: false,
    operational_writer_enabled: false
  }, null, 2)}\n`
);

if (failed.length > 0) {
  console.error(JSON.stringify({ failed }, null, 2));
  process.exit(1);
}

console.log("ADMISSORIUM_V020_READINESS_ARTIFACT_PASS=true");
console.log(JSON.stringify(artifact.totals));
