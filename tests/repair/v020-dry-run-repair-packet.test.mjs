import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { compileActuatorVerdict } from "../../src/verdict/compile-actuator-verdict.js";
import { compileAdmissionReceipt } from "../../src/receipt/compile-admission-receipt.js";
import { routeQuarantine } from "../../src/quarantine/route-quarantine.js";
import { compileDryRunRepairPacket } from "../../src/repair/compile-dry-run-repair-packet.js";
import { verifySignedObject } from "../../src/signing/deterministic-local-signing.js";

function fixture(name) {
  return JSON.parse(fs.readFileSync(`fixtures/v020/candidates/${name}.example.json`, "utf8"));
}

function packet(name) {
  const verdict = compileActuatorVerdict(fixture(name));
  const receipt = compileAdmissionReceipt(verdict);
  const quarantine = routeQuarantine(verdict, receipt);
  return compileDryRunRepairPacket(verdict, receipt, quarantine);
}

test("dry-run repair packet never enables writer side effects", () => {
  const p = packet("protected-truth-touch");

  assert.equal(p.repair_mode, "DRY_RUN_ONLY");
  assert.equal(p.writer_enabled, false);
  assert.equal(p.webhook_enabled, false);
  assert.equal(p.check_run_writer_enabled, false);
  assert.equal(p.pr_writer_enabled, false);
  assert.equal(p.issue_writer_enabled, false);
  assert.equal(p.package_publish_enabled, false);
  assert.equal(p.allowed_to_mutate_truth, false);
  assert.ok(p.forbidden_actions.includes("open_pull_request"));
  assert.ok(p.forbidden_actions.includes("write_check_run"));
  assert.ok(p.forbidden_actions.includes("mutate_truth"));
  assert.equal(verifySignedObject(p), true);
});

test("report-only pass still produces a signed no-writer dry-run packet", () => {
  const p = packet("projection-clean");

  assert.equal(p.repair_mode, "DRY_RUN_ONLY");
  assert.equal(p.writer_enabled, false);
  assert.equal(p.webhook_enabled, false);
  assert.equal(p.pr_writer_enabled, false);
  assert.equal(p.issue_writer_enabled, false);
  assert.equal(p.allowed_to_mutate_truth, false);
  assert.equal(verifySignedObject(p), true);
});
