import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const artifact = JSON.parse(
  fs.readFileSync("reports/current/admissorium-v020-readiness.json", "utf8")
);

test("v0.2.0 readiness artifact is pass-state and non-sovereign", () => {
  assert.equal(artifact.artifact, "ADMISSORIUM_V020_READINESS_ARTIFACT");
  assert.equal(artifact.state, "ADMISSORIUM_V020_READINESS_ARTIFACT_PASS");
  assert.equal(artifact.truth_warning, "NOT_TRUTH_SOURCE");
  assert.equal(artifact.completion_claim, false);
});

test("v0.2.0 readiness artifact binds all report-only gates", () => {
  assert.equal(artifact.totals.total_gates, 9);
  assert.equal(artifact.totals.failed_gates, 0);
  assert.ok(artifact.gates.every((gate) => gate.passed === true));
  assert.ok(artifact.gates.some((gate) => gate.id === "report_writers_history_binding"));
});

test("v0.2.0 readiness artifact does not authorize real writers", () => {
  assert.equal(artifact.writer_enabled, false);
  assert.equal(artifact.webhook_runtime_enabled, false);
  assert.equal(artifact.check_run_writer_enabled, false);
  assert.equal(artifact.pull_request_writer_enabled, false);
  assert.equal(artifact.issue_writer_enabled, false);
  assert.equal(artifact.package_publish_enabled, false);
  assert.equal(artifact.contents_write_enabled, false);
  assert.equal(artifact.operational_writer_enabled, false);
  assert.equal(artifact.network_required, false);
  assert.equal(artifact.token_persistence_enabled, false);
  assert.equal(artifact.allowed_to_mutate_truth, false);
});

test("v0.2.0 readiness artifact has local deterministic seal only", () => {
  assert.equal(typeof artifact.payload_hash_sha256, "string");
  assert.match(artifact.payload_hash_sha256, /^[a-f0-9]{64}$/);
  assert.equal(artifact.local_signature.production_signature, false);
  assert.match(artifact.local_signature.signature, /^[a-f0-9]{64}$/);
});
