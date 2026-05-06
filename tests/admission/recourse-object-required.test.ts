import assert from "node:assert/strict";
import test from "node:test";
import { assertRecourseObjectRequired } from "../../src/admission/assert-recourse-object-required.js";

function admissibleInput() {
  return {
    recourseObject: {
      object_type: "RecourseObject",
      recourse_object_id: "recourse-object-0001",
      status: "ACTIVE_TRUTH",
      claim_class: "recourse-object",
      artifact_id: "artifact-0005",
      recognition_object_ref: "ANAGNORIUM/recognition/current/recognition-object-0001.json",
      verification_result_ref: "VERIFRAX/verification/current/verification-result-0001.json",
      authority_object_ref: "AUCTORISEAL/authorities/current/authority-object-0001.json",
      freeze_object_ref: "SYNTAGMARIUM/freeze/objects/current/freeze-object-0001.json",
      accepted_epoch_ref: "ORBISTIUM/epochs/current/accepted-epoch-0001.json",
      chain_lock_ref: "ORBISTIUM/chains/current/minimum-object-chain-lock-0001.json",
      recognized_truth_bound: true,
      claim_posture: "BOUND_RECOURSE_FROM_RECOGNIZED_TRUTH",
      burden_assignment: "SYSTEM_RECOURSE_BURDEN_ATTACHED_TO_RECOGNIZED_ARTIFACT_CLAIM",
      remedy_path: "PUBLIC_OBJECT_COMPLETION_AND_BOUNDARY_PRESERVATION",
      escalation_path: "GOVERNANCE_REVIEW_IF_RECOGNITION_OR_RECOURSE_BOUNDARY_DRIFTS",
      closure_state: "OPEN_NOT_CLOSED",
      may_redefine_recognition: false,
      may_generate_recognition: false,
      may_mutate_recognition: false,
      may_mutate_verification: false,
      may_mutate_authority: false,
      may_mutate_accepted_epoch: false,
      may_mutate_chain_lock: false,
      may_infer_missing_truth: false,
    },
    recourseObjectIndex: {
      current_recourse_object_ref: "recourse/current/recourse-object-0001.json",
    },
    recognitionObject: {
      recognition_object_id: "recognition-object-0001",
      terminal_recognition: true,
    },
    verificationResult: { verification_result_id: "verification-result-0001" },
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

test("recourse object required passes for active bound recourse object", () => {
  const report = assertRecourseObjectRequired(admissibleInput());
  assert.equal(report.gate, "RECOURSE_OBJECT_REQUIRED");
  assert.equal(report.status, "green");
  assert.deepEqual(report.findings, []);
});

test("recourse object substitution is red", () => {
  const input = admissibleInput();
  input.recourseObject.recourse_object_id = "recourse-object-9999";

  const report = assertRecourseObjectRequired(input);
  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "RECOURSE_OBJECT_SUBSTITUTION"));
});

test("recourse without bound recognition is red", () => {
  const input = admissibleInput();
  input.recognitionObject.recognition_object_id = "recognition-object-9999";

  const report = assertRecourseObjectRequired(input);
  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "BOUND_RECOGNITION_OBJECT_MISSING_OR_SUBSTITUTED"));
});

test("recourse cannot generate recognition", () => {
  const input = admissibleInput();
  input.recourseObject.may_generate_recognition = true;

  const report = assertRecourseObjectRequired(input);
  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "RECOURSE_RECOGNITION_COLLAPSE"));
});

test("projection-added recourse object is red", () => {
  const input = {
    ...admissibleInput(),
    projection: {
      recourse_object_id: "projection-supplied-recourse",
    },
  };

  const report = assertRecourseObjectRequired(input);
  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "PROJECTION_ADDED_RECOURSE_OBJECT"));
});
