import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { compileTestModeWriterSimulation } from "../writer-sim/compile-test-mode-writer-simulation.js";
import { verifySignedObject } from "../signing/deterministic-local-signing.js";

const generated_at = "1970-01-01T00:00:00.000Z";

execFileSync("node", ["src/v020/compile-operator-review-bundle.js"], { stdio: "inherit" });

const operatorReport = JSON.parse(fs.readFileSync("reports/current/v020-operator-review-bundle.json", "utf8"));
const simulation = compileTestModeWriterSimulation(operatorReport, { generated_at });

const allPackets = [
  ...simulation.packets.check_run_packets,
  ...simulation.packets.issue_packets,
  ...simulation.packets.pull_request_packets
];

const packet_signature_failures = allPackets.filter((p) => !verifySignedObject(p));
const writer_violations = allPackets.filter((p) =>
  p.executed !== false ||
  p.dry_run !== true ||
  p.writer_enabled !== false ||
  p.network_enabled !== false ||
  p.token_required !== false ||
  p.webhook_enabled !== false ||
  p.check_run_writer_enabled !== false ||
  p.pr_writer_enabled !== false ||
  p.issue_writer_enabled !== false ||
  p.allowed_to_mutate_truth !== false ||
  p.external_target !== "NONE"
);

const summary = {
  report_type: "ADMISSORIUM_V020_TEST_MODE_WRITER_SIMULATION_SUITE",
  schema_version: "1.0.0",
  generated_at,
  state: "ADMISSORIUM_V020_TEST_MODE_WRITER_SIMULATION_PASS",

  simulation_signature_ok: verifySignedObject(simulation),
  packet_signature_failures: packet_signature_failures.length,
  writer_violations: writer_violations.length,

  total_cases: simulation.total_cases,
  check_run_packet_count: simulation.check_run_packet_count,
  issue_packet_count: simulation.issue_packet_count,
  pull_request_packet_count: simulation.pull_request_packet_count,
  total_packets: simulation.total_packets,

  writer_enabled: simulation.writer_enabled,
  network_enabled: simulation.network_enabled,
  token_required: simulation.token_required,
  webhook_enabled: simulation.webhook_enabled,
  check_run_writer_enabled: simulation.check_run_writer_enabled,
  pr_writer_enabled: simulation.pr_writer_enabled,
  issue_writer_enabled: simulation.issue_writer_enabled,
  allowed_to_mutate_truth: simulation.allowed_to_mutate_truth,

  simulation
};

if (
  summary.simulation_signature_ok !== true ||
  summary.packet_signature_failures !== 0 ||
  summary.writer_violations !== 0 ||
  summary.total_cases !== 5 ||
  summary.check_run_packet_count !== 5 ||
  summary.issue_packet_count !== 4 ||
  summary.pull_request_packet_count !== 5 ||
  summary.total_packets !== 14 ||
  summary.writer_enabled !== false ||
  summary.network_enabled !== false ||
  summary.token_required !== false ||
  summary.webhook_enabled !== false ||
  summary.check_run_writer_enabled !== false ||
  summary.pr_writer_enabled !== false ||
  summary.issue_writer_enabled !== false ||
  summary.allowed_to_mutate_truth !== false
) {
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

fs.writeFileSync("reports/current/v020-test-mode-writer-simulation.json", JSON.stringify(summary, null, 2) + "\n");
fs.writeFileSync("reports/history/v020-test-mode-writer-simulation.latest.json", JSON.stringify(summary, null, 2) + "\n");

console.log("ADMISSORIUM_V020_TEST_MODE_WRITER_SIMULATION_PASS=true");
console.log(JSON.stringify({
  total_cases: summary.total_cases,
  total_packets: summary.total_packets,
  check_run_packet_count: summary.check_run_packet_count,
  issue_packet_count: summary.issue_packet_count,
  pull_request_packet_count: summary.pull_request_packet_count,
  writer_violations: summary.writer_violations
}));
