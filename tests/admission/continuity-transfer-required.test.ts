import assert from "node:assert/strict";
import test from "node:test";
import { assertContinuityTransferRequired } from "../../src/admission/assert-continuity-transfer-required.js";

function admissibleInput() {
  return {
    continuityTransferObject: {
      object_type: "ContinuityTransferObject",
      continuity_transfer_id: "continuity-transfer-0001",
      status: "ACTIVE_TRUTH",
      claim_class: "continuity-transfer",
      chain_lock_ref: "ORBISTIUM/chains/current/minimum-object-chain-lock-0001.json",
      accepted_epoch_ref: "ORBISTIUM/epochs/current/accepted-epoch-0001.json",
      authority_object_ref: "AUCTORISEAL/authorities/current/authority-object-0001.json",
      recognition_object_ref: "ANAGNORIUM/recognition/current/recognition-object-0001.json",
      recourse_object_ref: "REGRESSORIUM/recourse/current/recourse-object-0001.json",
      recorded_not_narrated: true,
      append_only_continuity: true,
      historical_chain_reconstructable: true,
      requires_public_transfer_record_for_future_custody_change: true,
      may_transfer_authority_without_record: false,
      may_mutate_authority_object: false,
      may_mutate_accepted_epoch: false,
      may_mutate_chain_lock: false,
      may_mutate_recognition: false,
      may_mutate_recourse: false,
      may_infer_missing_truth: false,
    },
    continuityTransferIndex: {
      current_continuity_transfer_ref: "governance/continuity/current/continuity-transfer-0001.json",
    },
    authorityObject: { authority_object_id: "authority-object-0001" },
    acceptedEpoch: { accepted_epoch_id: "accepted-epoch-0001" },
    recognitionObject: { recognition_object_id: "recognition-object-0001" },
    recourseObject: { recourse_object_id: "recourse-object-0001" },
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

test("continuity transfer required passes for active bound continuity object", () => {
  const report = assertContinuityTransferRequired(admissibleInput());
  assert.equal(report.gate, "CONTINUITY_TRANSFER_REQUIRED");
  assert.equal(report.status, "green");
  assert.deepEqual(report.findings, []);
});

test("continuity transfer substitution is red", () => {
  const input = admissibleInput();
  input.continuityTransferObject.continuity_transfer_id = "continuity-transfer-9999";

  const report = assertContinuityTransferRequired(input);
  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "CONTINUITY_TRANSFER_SUBSTITUTION"));
});

test("unrecorded continuity transfer is red", () => {
  const input = admissibleInput();
  input.continuityTransferObject.recorded_not_narrated = false;

  const report = assertContinuityTransferRequired(input);
  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "CONTINUITY_TRANSFER_NOT_RECORDED"));
});

test("continuity transfer cannot execute authority transfer silently", () => {
  const input = admissibleInput();
  input.continuityTransferObject.may_transfer_authority_without_record = true;

  const report = assertContinuityTransferRequired(input);
  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "CONTINUITY_TRANSFER_AUTHORITY_OVERCLAIM"));
});

test("projection-added continuity transfer is red", () => {
  const input = {
    ...admissibleInput(),
    projection: {
      continuity_transfer_id: "projection-supplied-continuity-transfer",
    },
  };

  const report = assertContinuityTransferRequired(input);
  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "PROJECTION_ADDED_CONTINUITY_TRANSFER"));
});
