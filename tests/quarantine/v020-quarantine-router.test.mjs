import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { compileActuatorVerdict } from "../../src/verdict/compile-actuator-verdict.js";
import { compileAdmissionReceipt } from "../../src/receipt/compile-admission-receipt.js";
import { routeQuarantine } from "../../src/quarantine/route-quarantine.js";
import { verifySignedObject } from "../../src/signing/deterministic-local-signing.js";

function fixture(name) {
  return JSON.parse(fs.readFileSync(`fixtures/v020/candidates/${name}.example.json`, "utf8"));
}

function record(name) {
  const verdict = compileActuatorVerdict(fixture(name));
  const receipt = compileAdmissionReceipt(verdict);
  return routeQuarantine(verdict, receipt);
}

test("clean projection routes to no-quarantine report-only lane", () => {
  const q = record("projection-clean");
  assert.equal(q.quarantine_required, false);
  assert.equal(q.route, "NO_QUARANTINE_REPORT_ONLY");
  assert.equal(q.writer_enabled, false);
  assert.equal(q.webhook_enabled, false);
  assert.equal(q.check_run_writer_enabled, false);
  assert.equal(q.pr_writer_enabled, false);
  assert.equal(q.issue_writer_enabled, false);
  assert.equal(q.allowed_to_mutate_truth, false);
  assert.equal(verifySignedObject(q), true);
});

test("unsafe candidates route to private review quarantine without writers", () => {
  for (const name of ["protected-truth-touch", "sovereign-language", "package-publish", "secret-bearing"]) {
    const q = record(name);
    assert.equal(q.quarantine_required, true);
    assert.equal(q.route, "PRIVATE_REVIEW_QUARANTINE");
    assert.equal(q.writer_enabled, false);
    assert.equal(q.webhook_enabled, false);
    assert.equal(q.check_run_writer_enabled, false);
    assert.equal(q.pr_writer_enabled, false);
    assert.equal(q.issue_writer_enabled, false);
    assert.equal(q.allowed_to_mutate_truth, false);
    assert.equal(verifySignedObject(q), true);
  }
});
