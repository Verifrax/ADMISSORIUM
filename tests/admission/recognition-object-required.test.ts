import assert from "node:assert/strict";
import test from "node:test";
import { assertRecognitionObjectRequired } from "../../src/admission/assert-recognition-object-required.js";

function admissibleInput() {
  return {
    recognitionObject: {
      object_type: "RecognitionObject",
      recognition_object_id: "recognition-object-0001",
      status: "ACTIVE_TRUTH",
      claim_class: "recognition-object",
      artifact_id: "artifact-0005",
      recognized_truth: "artifact-0005 verification result is terminally recognized under the frozen chain prefix",
      verification_result_ref: "VERIFRAX/verification/current/verification-result-0001.json",
      replay_bundle_ref: "VERIFRAX/replay/current/replay-bundle-0001.json",
      authority_object_ref: "AUCTORISEAL/authorities/current/authority-object-0001.json",
      freeze_object_ref: "SYNTAGMARIUM/freeze/objects/current/freeze-object-0001.json",
      accepted_epoch_ref: "ORBISTIUM/epochs/current/accepted-epoch-0001.json",
      chain_lock_ref: "ORBISTIUM/chains/current/minimum-object-chain-lock-0001.json",
      recognition_passed: true,
      terminal_recognition: true,
      recourse_ready: false,
      may_assign_recourse: false,
      may_select_remedy: false,
      may_close_recourse: false,
      may_mutate_verification: false,
      may_mutate_authority: false,
      may_mutate_accepted_epoch: false,
      may_infer_missing_truth: false,
    },
    recognitionObjectIndex: {
      current_recognition_object_ref: "recognition/current/recognition-object-0001.json",
    },
    verificationResult: { verification_result_id: "verification-result-0001" },
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

test("recognition object required passes for active bound recognition object", () => {
  const report = assertRecognitionObjectRequired(admissibleInput());
  assert.equal(report.gate, "RECOGNITION_OBJECT_REQUIRED");
  assert.equal(report.status, "green");
  assert.deepEqual(report.findings, []);
});

test("recognition object substitution is red", () => {
  const input = admissibleInput();
  input.recognitionObject.recognition_object_id = "recognition-object-9999";

  const report = assertRecognitionObjectRequired(input);
  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "RECOGNITION_OBJECT_SUBSTITUTION"));
});

test("recognition cannot collapse into recourse", () => {
  const input = admissibleInput();
  input.recognitionObject.may_assign_recourse = true;

  const report = assertRecognitionObjectRequired(input);
  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "RECOGNITION_RECOURSE_COLLAPSE"));
});

test("projection-added recognition object is red", () => {
  const input = {
    ...admissibleInput(),
    projection: {
      recognition_object_id: "projection-supplied-recognition",
    },
  };

  const report = assertRecognitionObjectRequired(input);
  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "PROJECTION_ADDED_RECOGNITION_OBJECT"));
});
