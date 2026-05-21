import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { compileActuatorVerdict } from "../../src/verdict/compile-actuator-verdict.js";
import { compileAdmissionReceipt } from "../../src/receipt/compile-admission-receipt.js";
import { verifySignedObject } from "../../src/signing/deterministic-local-signing.js";

function fixture(name) {
  return JSON.parse(fs.readFileSync(`fixtures/v020/candidates/${name}.example.json`, "utf8"));
}

test("admission receipt is signed and non-sovereign", () => {
  const verdict = compileActuatorVerdict(fixture("projection-clean"));
  const receipt = compileAdmissionReceipt(verdict);

  assert.equal(receipt.receipt_type, "ADMISSORIUM_ADMISSION_RECEIPT");
  assert.equal(receipt.admission, "REPORT_ONLY_ADMISSION");
  assert.equal(receipt.truth_warning, "NOT_TRUTH_SOURCE");
  assert.equal(receipt.non_sovereign_boundary, "ADMISSORIUM does not decide truth.");
  assert.equal(receipt.writer_enabled, false);
  assert.equal(receipt.webhook_enabled, false);
  assert.equal(receipt.allowed_to_mutate_truth, false);
  assert.equal(verifySignedObject(receipt), true);
});

test("blocked verdict receipt is not admitted", () => {
  const verdict = compileActuatorVerdict(fixture("sovereign-language"));
  const receipt = compileAdmissionReceipt(verdict);

  assert.equal(receipt.admission, "NOT_ADMITTED");
  assert.equal(receipt.risk, "RED");
  assert.equal(receipt.allowed_to_mutate_truth, false);
  assert.equal(verifySignedObject(receipt), true);
});
