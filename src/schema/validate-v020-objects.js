import fs from "node:fs";
import { validateFile } from "./validate-object.js";

const PAIRS = [
  ["schemas/admissorium-actuator-policy.schema.json", "policies/admissorium-actuator-policy.json"],
  ["schemas/protected-truth-paths.schema.json", "policies/protected-truth-paths.json"],
  ["schemas/github-app-permission-policy.schema.json", "policies/github-app-permission-policy.json"],
  ["schemas/emergency-stop.schema.json", "policies/emergency-stop.json"],
  ["schemas/mutation-classification-policy.schema.json", "policies/mutation-classification-policy.json"],
  ["schemas/actuator-verdict.schema.json", "examples/actuator-verdict.example.json"],
  ["schemas/admission-receipt.schema.json", "examples/admission-receipt.example.json"],
  ["schemas/quarantine-record.schema.json", "examples/quarantine-record.example.json"],
  ["schemas/dry-run-repair-plan.schema.json", "examples/dry-run-repair-plan.example.json"],
  ["schemas/v020-readiness.schema.json", "examples/v020-readiness.example.json"]
];

export function validateV020Objects() {
  const results = PAIRS.map(([schema, object]) => validateFile(schema, object));
  const failed = results.filter(r => !r.ok);

  return {
    report_type: "ADMISSORIUM_V020_SCHEMA_VALIDATION_REPORT",
    schema_version: "1.0.0",
    admissorium_version: "0.2.0",
    truth_warning: "NOT_TRUTH_SOURCE",
    state: failed.length ? "ADMISSORIUM_V020_OBJECT_SCHEMAS_FAIL" : "ADMISSORIUM_V020_OBJECT_SCHEMAS_PASS",
    system_complete: false,
    writer_enabled: false,
    webhook_enabled: false,
    direct_main_write_enabled: false,
    package_publish_enabled: false,
    summary: {
      total: results.length,
      passed: results.length - failed.length,
      failed: failed.length
    },
    results
  };
}

export function writeReport() {
  const report = validateV020Objects();

  fs.mkdirSync("reports/current", { recursive: true });
  fs.writeFileSync("reports/current/v020-schema-validation.json", JSON.stringify(report, null, 2) + "\n");

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = `reports/history/v020-schema-validation-${stamp}`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/manifest.json`, JSON.stringify({
    history_type: "ADMISSORIUM_V020_SCHEMA_VALIDATION_HISTORY",
    created_at: new Date().toISOString(),
    current_report: "reports/current/v020-schema-validation.json",
    state: report.state,
    system_complete: false,
    writer_enabled: false,
    webhook_enabled: false,
    summary: report.summary
  }, null, 2) + "\n");

  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = writeReport();
  console.log(`${report.state}=true`);
  console.log(JSON.stringify(report.summary));
  if (report.summary.failed) process.exit(1);
}
