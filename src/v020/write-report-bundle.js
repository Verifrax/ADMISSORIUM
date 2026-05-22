import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { sha256, writeJsonReport } from "../report/write-json-report.js";

const STEPS = [
  ["v020:schema:validate", "ADMISSORIUM_V020_OBJECT_SCHEMAS_PASS=true"],
  ["v020:classify", "ADMISSORIUM_V020_CLASSIFIER_COMPARATOR_PASS=true"],
  ["v020:verdict", "ADMISSORIUM_V020_ACTUATOR_VERDICT_RECEIPT_PASS=true"],
  ["v020:quarantine", "ADMISSORIUM_V020_QUARANTINE_REPAIR_PASS=true"],
  ["v020:operator-review", "ADMISSORIUM_V020_OPERATOR_REVIEW_BUNDLE_PASS=true"],
  ["v020:writer-sim", "ADMISSORIUM_V020_TEST_MODE_WRITER_SIMULATION_PASS=true"],
  ["v020:webhook", "ADMISSORIUM_V020_WEBHOOK_SIGNATURE_VERIFICATION_PASS=true"],
  ["v020:hostile", "ADMISSORIUM_V020_HOSTILE_FIXTURES_PASS=true"]
];

function runStep(script, expectedToken) {
  const output = execFileSync("npm", ["run", script], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  process.stdout.write(output);

  return {
    script,
    expected_token: expectedToken,
    passed: output.includes(expectedToken),
    output_sha256: sha256(output)
  };
}

function readCurrentReportHashes() {
  const dir = path.join(process.cwd(), "reports", "current");
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => {
      const fullPath = path.join(dir, file);
      const text = fs.readFileSync(fullPath, "utf8");
      return {
        file,
        path: fullPath,
        sha256: sha256(text)
      };
    });
}

const stepResults = STEPS.map(([script, token]) => runStep(script, token));
const failed = stepResults.filter((step) => !step.passed);

const currentReports = readCurrentReportHashes();

const report = {
  suite: "ADMISSORIUM_V020_REPORT_WRITERS_HISTORY_BINDING",
  state: failed.length === 0 ? "ADMISSORIUM_V020_REPORT_BUNDLE_PASS" : "ADMISSORIUM_V020_REPORT_BUNDLE_FAIL",
  truth_warning: "NOT_TRUTH_SOURCE",
  writer_enabled: false,
  webhook_enabled: false,
  check_run_writer_enabled: false,
  pull_request_writer_enabled: false,
  issue_writer_enabled: false,
  contents_write_enabled: false,
  package_publish_enabled: false,
  allowed_to_mutate_truth: false,
  network_enabled: false,
  token_persistence_enabled: false,
  total_steps: stepResults.length,
  passed_steps: stepResults.length - failed.length,
  failed_steps: failed.length,
  current_report_count: currentReports.length,
  current_reports: currentReports,
  steps: stepResults,
  history_snapshot_binding: true,
  report_only_before_writer: true
};

const result = writeJsonReport({
  name: "admissorium-v020-report-bundle",
  report
});

if (failed.length > 0) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("ADMISSORIUM_V020_REPORT_BUNDLE_PASS=true");
console.log(JSON.stringify({
  total_steps: report.total_steps,
  passed_steps: report.passed_steps,
  failed_steps: report.failed_steps,
  current_report_count: report.current_report_count,
  payload_hash_sha256: result.envelope.payload_hash_sha256
}));
