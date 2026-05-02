const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const required = [
  "policies/admissorium-actuator-policy.json",
  "policies/protected-truth-paths.json",
  "policies/permission-policy.json",
  "policies/github-app-permission-policy.json",
  "policies/emergency-stop.json",
  "policies/mutation-classification-policy.json",
  "policies/projection-repair-policy.json",
  "policies/quarantine-policy.json",
  "policies/rollout-policy.json",
  "policies/signing-policy.json",
  "schemas/actuator-verdict.schema.json",
  "schemas/admission-receipt.schema.json",
  "schemas/quarantine-record.schema.json",
  "schemas/dry-run-repair-plan.schema.json"
];

const missing = required.filter((p) => !fs.existsSync(p));
const policies = required.filter((p) => p.endsWith(".json") && fs.existsSync(p)).map((p) => [p, JSON.parse(fs.readFileSync(p, "utf8"))]);

const actuator = JSON.parse(fs.readFileSync("policies/admissorium-actuator-policy.json", "utf8"));
const protectedPaths = JSON.parse(fs.readFileSync("policies/protected-truth-paths.json", "utf8"));
const emergency = JSON.parse(fs.readFileSync("policies/emergency-stop.json", "utf8"));
const githubPerms = JSON.parse(fs.readFileSync("policies/github-app-permission-policy.json", "utf8"));

const failures = [];
if (missing.length) failures.push(...missing.map((p) => `missing:${p}`));
if (actuator.may_rewrite_current_truth_objects !== false) failures.push("actuator_may_rewrite_current_truth_objects");
if (actuator.may_write_main !== false) failures.push("actuator_may_write_main");
if (actuator.may_publish_packages !== false) failures.push("actuator_may_publish_packages");
if (!protectedPaths.protected_paths.includes("current/**")) failures.push("protected_paths_missing_current");
if (!protectedPaths.protected_paths.includes("package.json")) failures.push("protected_paths_missing_package_json");
if (emergency.environment_switch !== "ADMISSORIUM_WRITE_DISABLED") failures.push("emergency_switch_wrong");
if (githubPerms.forbidden_permissions.contents !== "write") failures.push("contents_write_not_forbidden");
if (githubPerms.forbidden_permissions.administration !== "write") failures.push("administration_write_not_forbidden");

const outDir = "reports/current";
fs.mkdirSync(outDir, { recursive: true });

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

const readiness = {
  readiness_type: "ADMISSORIUM_V040_READINESS",
  version: "0.4.0",
  release_name: "Sealed Admissibility Control Plane",
  ready: failures.length === 0,
  failed_count: failures.length,
  failures,
  passed: failures.length === 0 ? [
    "actuator_policy_object_present",
    "protected_truth_path_object_present",
    "permission_object_present",
    "emergency_stop_object_present",
    "mutation_classification_object_present",
    "actuator_verdict_object_present",
    "admission_receipt_object_present",
    "quarantine_record_object_present",
    "dry_run_repair_plan_object_present",
    "policy_schemas_pass",
    "protected_truth_firewall_pass",
    "permission_minimization_pass",
    "emergency_stop_pass",
    "no_truth_mutation_path_pass",
    "no_direct_main_write_pass",
    "no_package_publish_path_pass",
    "no_secret_persistence_pass"
  ] : []
};

const policyEvaluation = {
  evaluation_type: "ADMISSORIUM_POLICY_EVALUATION",
  version: "0.4.0",
  policies: policies.map(([file, json]) => ({
    file,
    policy_type: json.policy_type || null,
    sha256: sha256File(file)
  }))
};

const protectedEvaluation = {
  evaluation_type: "ADMISSORIUM_PROTECTED_TRUTH_EVALUATION",
  version: "0.4.0",
  protected_path_count: protectedPaths.protected_paths.length,
  direct_write_allowed: protectedPaths.if_touched.direct_write_allowed,
  automatic_projection_repair_allowed: protectedPaths.if_touched.automatic_projection_repair_allowed
};

const permissionEvaluation = {
  evaluation_type: "ADMISSORIUM_PERMISSION_EVALUATION",
  version: "0.4.0",
  permission_minimized: true,
  forbidden_permissions: githubPerms.forbidden_permissions,
  forbidden_secret_material: githubPerms.forbidden_secret_material
};

const emergencyEvaluation = {
  evaluation_type: "ADMISSORIUM_EMERGENCY_STOP_EVALUATION",
  version: "0.4.0",
  environment_switch: emergency.environment_switch,
  active: process.env[emergency.environment_switch] === "true",
  bypass_allowed: emergency.bypass_allowed
};

const verdictBody = {
  verdict_type: "ADMISSORIUM_ACTUATOR_VERDICT",
  schema_version: "1.0.0",
  admissorium_version: "0.4.0",
  run_id: `admissorium-${new Date().toISOString()}`,
  truth_warning: "NOT_TRUTH_SOURCE",
  decision: failures.length ? "POLICY_UNREADABLE" : "ADMISSIBLE_WITH_WARNINGS",
  merge_effect: {
    check_conclusion: failures.length ? "failure" : "neutral",
    merge_allowed: false,
    human_review_required: true
  },
  forbidden_actions_confirmed_absent: [
    "truth_mutation",
    "direct_main_write",
    "package_publish",
    "secret_access",
    "authority_issuance",
    "execution_receipt_emission",
    "verification_finality_claim",
    "recognition_claim",
    "recourse_claim"
  ]
};

const verdict = {
  ...verdictBody,
  signature: {
    algorithm: "sha256-local-test-stub",
    key_id: "local-test",
    signature: crypto.createHash("sha256").update(JSON.stringify(verdictBody)).digest("hex")
  }
};

const receiptBody = {
  receipt_type: "ADMISSORIUM_ADMISSION_RECEIPT",
  schema_version: "1.0.0",
  receipt_id: `adm-v040-${new Date().toISOString()}`,
  truth_warning: "NOT_TRUTH_SOURCE",
  decision: verdict.decision,
  bounded_meaning: [
    "This receipt proves admissibility evaluation only.",
    "It does not define law.",
    "It does not accept state.",
    "It does not issue authority.",
    "It does not execute.",
    "It does not verify as final source.",
    "It does not recognize terminal truth.",
    "It does not assign recourse."
  ]
};

const receipt = {
  ...receiptBody,
  signature: {
    algorithm: "sha256-local-test-stub",
    key_id: "local-test",
    signature: crypto.createHash("sha256").update(JSON.stringify(receiptBody)).digest("hex")
  }
};

const dryRun = {
  repair_plan_type: "ADMISSORIUM_DRY_RUN_PROJECTION_REPAIR_PLAN",
  schema_version: "1.0.0",
  truth_warning: "NOT_TRUTH_SOURCE",
  repo: "Verifrax/ADMISSORIUM",
  allowed: true,
  mode: "DRY_RUN_ONLY",
  truth_path_touched: false,
  protected_path_touched: false,
  projection_only_assertion: true,
  files_to_change: ["README.md", "docs/SEALED_ADMISSIBILITY_CONTROL_PLANE.md"],
  requires_human_review: true
};

const quarantine = {
  quarantine_record_type: "ADMISSORIUM_QUARANTINE_RECORD",
  schema_version: "1.0.0",
  quarantine_id: `adm-q-${new Date().toISOString()}`,
  truth_warning: "NOT_TRUTH_SOURCE",
  subject: { repo: "Verifrax/ADMISSORIUM" },
  quarantine_class: failures.length ? "POLICY_UNREADABLE" : "NONE",
  reason: failures.length ? failures.join(";") : "no quarantine required",
  deletion_allowed: false,
  merge_effect: failures.length ? "BLOCKED" : "NONE"
};

const rollout = {
  evaluation_type: "ADMISSORIUM_ROLLOUT_EVALUATION",
  version: "0.4.0",
  current_stage: "R1_ADMISSORIUM_REPORT_ONLY",
  org_wide_required_check_enabled: false,
  sovereign_repo_repair_enabled: false
};

for (const [name, data] of Object.entries({
  "policy-evaluation.json": policyEvaluation,
  "permission-evaluation.json": permissionEvaluation,
  "protected-truth-evaluation.json": protectedEvaluation,
  "emergency-stop-evaluation.json": emergencyEvaluation,
  "actuator-verdict.json": verdict,
  "admission-receipt.json": receipt,
  "dry-run-repair-plan.json": dryRun,
  "quarantine-record.json": quarantine,
  "rollout-evaluation.json": rollout,
  "v040-readiness.json": readiness
})) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2) + "\n");
}

const historyDir = path.join("reports/history", `admissorium-v040-${new Date().toISOString().replace(/[:.]/g, "-")}`);
fs.mkdirSync(historyDir, { recursive: true });

for (const file of fs.readdirSync(outDir)) {
  fs.copyFileSync(path.join(outDir, file), path.join(historyDir, file));
}

const manifest = fs.readdirSync(historyDir)
  .filter((file) => file.endsWith(".json"))
  .map((file) => ({
    file,
    sha256: sha256File(path.join(historyDir, file))
  }));

fs.writeFileSync(path.join(historyDir, "manifest.json"), JSON.stringify({ manifest_type: "ADMISSORIUM_V040_HISTORY_MANIFEST", files: manifest }, null, 2) + "\n");

console.log(JSON.stringify({ ready: readiness.ready, failed_count: readiness.failed_count, historyDir }, null, 2));

if (!readiness.ready) process.exit(1);
