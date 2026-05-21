import fs from "node:fs";
import path from "node:path";
import { compileActuatorVerdict } from "../verdict/compile-actuator-verdict.js";
import { compileAdmissionReceipt } from "../receipt/compile-admission-receipt.js";
import { verifySignedObject } from "../signing/deterministic-local-signing.js";

const candidateDir = "fixtures/v020/candidates";
const outDir = "reports/current";
const historyDir = "reports/history";
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(historyDir, { recursive: true });

const generated_at = "1970-01-01T00:00:00.000Z";
const files = fs.readdirSync(candidateDir).filter((f) => f.endsWith(".json")).sort();

const results = files.map((file) => {
  const candidate = JSON.parse(fs.readFileSync(path.join(candidateDir, file), "utf8"));
  const verdict = compileActuatorVerdict(candidate, { generated_at });
  const receipt = compileAdmissionReceipt(verdict, { generated_at });

  return {
    file,
    candidate_id: verdict.candidate_id,
    verdict_state: verdict.state,
    risk: verdict.risk,
    verdict_signature_ok: verifySignedObject(verdict),
    receipt_signature_ok: verifySignedObject(receipt),
    writer_enabled: verdict.writer_enabled,
    webhook_enabled: verdict.webhook_enabled,
    check_run_writer_enabled: verdict.check_run_writer_enabled,
    package_publish_enabled: verdict.package_publish_enabled,
    allowed_to_mutate_truth: verdict.allowed_to_mutate_truth,
    verdict,
    receipt
  };
});

const summary = {
  report_type: "ADMISSORIUM_V020_VERDICT_RECEIPT_SUITE",
  schema_version: "1.0.0",
  generated_at,
  mode: "REPORT_ONLY",
  total: results.length,
  signed_verdicts: results.filter((r) => r.verdict_signature_ok).length,
  signed_receipts: results.filter((r) => r.receipt_signature_ok).length,
  admitted_report_only: results.filter((r) => r.verdict_state === "ADMISSIBLE_REPORT_ONLY").length,
  blocked_or_quarantined: results.filter((r) => r.verdict_state !== "ADMISSIBLE_REPORT_ONLY").length,
  failed: results.filter((r) =>
    !r.verdict_signature_ok ||
    !r.receipt_signature_ok ||
    r.writer_enabled !== false ||
    r.webhook_enabled !== false ||
    r.check_run_writer_enabled !== false ||
    r.package_publish_enabled !== false ||
    r.allowed_to_mutate_truth !== false
  ).length,
  results
};

fs.writeFileSync(`${outDir}/v020-verdict-receipt-suite.json`, JSON.stringify(summary, null, 2) + "\n");
fs.writeFileSync(`${historyDir}/v020-verdict-receipt-suite.latest.json`, JSON.stringify(summary, null, 2) + "\n");

if (summary.failed !== 0) {
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

console.log("ADMISSORIUM_V020_ACTUATOR_VERDICT_RECEIPT_PASS=true");
console.log(JSON.stringify({
  total: summary.total,
  signed_verdicts: summary.signed_verdicts,
  signed_receipts: summary.signed_receipts,
  admitted_report_only: summary.admitted_report_only,
  blocked_or_quarantined: summary.blocked_or_quarantined,
  failed: summary.failed
}));
