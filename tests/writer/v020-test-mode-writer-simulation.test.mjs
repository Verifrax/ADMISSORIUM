import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { compileTestModeWriterSimulation } from "../../src/writer-sim/compile-test-mode-writer-simulation.js";
import { verifySignedObject } from "../../src/signing/deterministic-local-signing.js";

function buildSimulation() {
  execFileSync("node", ["src/v020/compile-operator-review-bundle.js"], { stdio: "ignore" });
  const report = JSON.parse(fs.readFileSync("reports/current/v020-operator-review-bundle.json", "utf8"));
  return compileTestModeWriterSimulation(report, { generated_at: "1970-01-01T00:00:00.000Z" });
}

test("test-mode writer simulation emits signed packets with zero side effects", () => {
  const sim = buildSimulation();
  assert.equal(sim.state, "ADMISSORIUM_V020_TEST_MODE_WRITER_SIMULATION_PASS");
  assert.equal(sim.total_cases, 5);
  assert.equal(sim.check_run_packet_count, 5);
  assert.equal(sim.issue_packet_count, 4);
  assert.equal(sim.pull_request_packet_count, 5);
  assert.equal(sim.total_packets, 14);
  assert.equal(sim.writer_enabled, false);
  assert.equal(sim.network_enabled, false);
  assert.equal(sim.token_required, false);
  assert.equal(sim.webhook_enabled, false);
  assert.equal(sim.check_run_writer_enabled, false);
  assert.equal(sim.pr_writer_enabled, false);
  assert.equal(sim.issue_writer_enabled, false);
  assert.equal(sim.allowed_to_mutate_truth, false);
  assert.equal(verifySignedObject(sim), true);
});

test("every simulated writer packet is dry-run only and signed", () => {
  const sim = buildSimulation();
  const packets = [
    ...sim.packets.check_run_packets,
    ...sim.packets.issue_packets,
    ...sim.packets.pull_request_packets
  ];

  for (const packet of packets) {
    assert.equal(packet.dry_run, true);
    assert.equal(packet.simulated, true);
    assert.equal(packet.executed, false);
    assert.equal(packet.external_target, "NONE");
    assert.equal(packet.writer_enabled, false);
    assert.equal(packet.network_enabled, false);
    assert.equal(packet.token_required, false);
    assert.equal(packet.webhook_enabled, false);
    assert.equal(packet.check_run_writer_enabled, false);
    assert.equal(packet.pr_writer_enabled, false);
    assert.equal(packet.issue_writer_enabled, false);
    assert.equal(packet.allowed_to_mutate_truth, false);
    assert.equal(verifySignedObject(packet), true);
  }
});
