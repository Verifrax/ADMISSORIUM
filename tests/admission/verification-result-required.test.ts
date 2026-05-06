import assert from "node:assert/strict";
import test from "node:test";
import { assertVerificationResultRequired } from "../../src/admission/assert-verification-result-required.js";

function admissibleInput() {
  return {
    verificationResult: {
      object_type: "VerificationResult",
      verification_result_id: "verification-result-0001",
      status: "ACTIVE_TRUTH",
      claim_class: "verification-result",
      artifact_id: "artifact-0005",
      replay_bundle_ref: "VERIFRAX/replay/current/replay-bundle-0001.json",
      authority_object_ref: "AUCTORISEAL/authorities/current/authority-object-0001.json",
      freeze_object_ref: "SYNTAGMARIUM/freeze/objects/current/freeze-object-0001.json",
      accepted_epoch_ref: "ORBISTIUM/epochs/current/accepted-epoch-0001.json",
      chain_lock_ref: "ORBISTIUM/chains/current/minimum-object-chain-lock-0001.json",
      verification_passed: true,
      may_recognize_terminal_truth: false,
      may_assign_recourse: false,
      may_mutate_authority: false,
      may_mutate_accepted_epoch: false,
      may_infer_missing_truth: false,
    },
    verificationResultIndex: {
      current_verification_result_ref: "verification/current/verification-result-0001.json",
    },
    replayBundle: { replay_bundle_id: "replay-bundle-0001" },
    authorityObject: { authority_object_id: "authority-object-0001" },
    freezeObject: { freeze_object_id: "freeze-object-0001" },
    acceptedEpoch: { accepted_epoch_id: "accepted-epoch-0001" },
    chainLock: {
      chain: [
        { claim_class: "admission-object" },
        { claim_class: "chain-lock" },
        { claim_class: "replay-bundle" },
        { claim_class: "projection-lock" },
        { claim_class: "accepted-epoch" },
        { claim_class: "authority-object" },
        { claim_class: "verification-result" },
        { claim_class: "recognition-object" },
        { claim_class: "recourse-object" },
        { claim_class: "continuity-transfer" },
      ],
    },
  };
}

test("verification result required passes for active bound verification result", () => {
  const report = assertVerificationResultRequired(admissibleInput());
  assert.equal(report.gate, "VERIFICATION_RESULT_REQUIRED");
  assert.equal(report.status, "green");
  assert.deepEqual(report.findings, []);
});

test("verification result substitution is red", () => {
  const input = admissibleInput();
  input.verificationResult.verification_result_id = "verification-result-9999";

  const report = assertVerificationResultRequired(input);
  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "VERIFICATION_RESULT_SUBSTITUTION"));
});

test("verification result cannot collapse into recognition", () => {
  const input = admissibleInput();
  input.verificationResult.may_recognize_terminal_truth = true;

  const report = assertVerificationResultRequired(input);
  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "VERIFICATION_RESULT_RECOGNITION_COLLAPSE"));
});

test("projection-added verification result is red", () => {
  const input = {
    ...admissibleInput(),
    projection: {
      verification_result_id: "projection-supplied-verification",
    },
  };

  const report = assertVerificationResultRequired(input);
  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "PROJECTION_ADDED_VERIFICATION_RESULT"));
});
