import fs from "node:fs";
import path from "node:path";
import { compileActuatorVerdict } from "../verdict/compile-actuator-verdict.js";
import { compileAdmissionReceipt } from "../receipt/compile-admission-receipt.js";
import { routeQuarantine } from "../quarantine/route-quarantine.js";
import { compileDryRunRepairPacket } from "../repair/compile-dry-run-repair-packet.js";
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
  const quarantine = routeQuarantine(verdict, receipt, { generated_at });
  const repair_packet = compileDryRunRepairPacket(verdict, receipt, quarantine, { generated_at });

  return {
    file,
    candidate_id: verdict.candidate_id,
    risk: verdict.risk,
    verdict_state: verdict.state,
    quarantine_required: quarantine.quarantine_required,
    quarantine_route: quarantine.route,
    repair_mode: repair_packet.repair_mode,

    quarantine_signature_ok: verifySignedObject(quarantine),
    repair_packet_signature_ok: verifySignedObject(repair_packet),

    writer_enabled: repair_packet.writer_enabled,
    webhook_enabled: repair_packet.webhook_enabled,
    check_run_writer_enabled: repair_packet.check_run_writer_enabled,
    pr_writer_enabled: repair_packet.pr_writer_enabled,
    issue_writer_enabled: repair_packet.issue_writer_enabled,
    package_publish_enabled: repair_packet.package_publish_enabled,
    allowed_to_mutate_truth: repair_packet.allowed_to_mutate_truth,

    quarantine,
    repair_packet
  };
});

const summary = {
  report_type: "ADMISSORIUM_V020_QUARANTINE_REPAIR_SUITE",
  schema_version: "1.0.0",
  generated_at,
  mode: "REPORT_ONLY_DRY_RUN",
  total: results.length,
  quarantined: results.filter((r) => r.quarantine_required).length,
  passed_without_quarantine: results.filter((r) => !r.quarantine_required).length,
  signed_quarantine_records: results.filter((r) => r.quarantine_signature_ok).length,
  signed_repair_packets: results.filter((r) => r.repair_packet_signature_ok).length,
  failed: results.filter((r) =>
    !r.quarantine_signature_ok ||
    !r.repair_packet_signature_ok ||
    r.writer_enabled !== false ||
    r.webhook_enabled !== false ||
    r.check_run_writer_enabled !== false ||
    r.pr_writer_enabled !== false ||
    r.issue_writer_enabled !== false ||
    r.package_publish_enabled !== false ||
    r.allowed_to_mutate_truth !== false
  ).length,
  results
};

fs.writeFileSync(`${outDir}/v020-quarantine-repair-suite.json`, JSON.stringify(summary, null, 2) + "\n");
fs.writeFileSync(`${historyDir}/v020-quarantine-repair-suite.latest.json`, JSON.stringify(summary, null, 2) + "\n");

if (summary.failed !== 0) {
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

console.log("ADMISSORIUM_V020_QUARANTINE_REPAIR_PASS=true");
console.log(JSON.stringify({
  total: summary.total,
  quarantined: summary.quarantined,
  passed_without_quarantine: summary.passed_without_quarantine,
  signed_quarantine_records: summary.signed_quarantine_records,
  signed_repair_packets: summary.signed_repair_packets,
  failed: summary.failed
}));
