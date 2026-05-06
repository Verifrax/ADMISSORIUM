import assert from "node:assert/strict";
import test from "node:test";
import { assertActiveHistoricalTruthTypingRequired } from "../../src/admission/assert-active-historical-truth-typing-required.js";

function admissibleInput() {
  return {
    truthTyping: {
      object_type: "ActiveHistoricalTruthTyping",
      typing_id: "active-historical-truth-typing-0001",
      status: "ACTIVE_TRUTH",
      truth_categories: [
        "ACTIVE_LAW",
        "ACTIVE_TRUTH",
        "ACTIVE_INDEX",
        "EVIDENCE_OBJECT",
        "HISTORICAL_SNAPSHOT",
        "DERIVED_PROJECTION",
        "STATUS_SURFACE_NOT_TRUTH_SOURCE",
        "QUARANTINED",
        "TRANSITIONAL",
      ],
      current_truth_refs: [
        { object_family: "claim-class-admission" },
        { object_family: "accepted-claim-class-state" },
        { object_family: "chain-lock" },
        { object_family: "accepted-epoch" },
        { object_family: "freeze-object" },
        { object_family: "authority-object" },
        { object_family: "replay-bundle" },
        { object_family: "verification-result" },
        { object_family: "recognition-object" },
        { object_family: "recourse-object" },
        { object_family: "continuity-transfer" },
      ],
      historical_material_policy: "MUST_SELF_IDENTIFY_AS_HISTORICAL",
      projection_policy: "PROJECTIONS_NEVER_ACTIVE_TRUTH",
      status_surface_policy: "STATUS_SURFACES_NOT_TRUTH_SOURCE",
      current_truth_policy: "ONE_ACTIVE_TRUTH_PER_OBJECT_FAMILY",
      may_promote_projection_to_truth: false,
      may_promote_status_to_truth: false,
      may_promote_historical_snapshot_to_current: false,
      may_infer_missing_truth: false,
    },
    truthTypingIndex: {
      current_truth_typing_ref: "truth-typing/current/active-historical-truth-typing-0001.json",
    },
  };
}

test("active historical truth typing passes for complete active object path", () => {
  const report = assertActiveHistoricalTruthTypingRequired(admissibleInput());
  assert.equal(report.gate, "ACTIVE_HISTORICAL_TRUTH_TYPING_REQUIRED");
  assert.equal(report.status, "green");
  assert.deepEqual(report.findings, []);
});

test("truth typing substitution is red", () => {
  const input = admissibleInput();
  input.truthTyping.typing_id = "active-historical-truth-typing-9999";
  const report = assertActiveHistoricalTruthTypingRequired(input);
  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "TRUTH_TYPING_SUBSTITUTION"));
});

test("projection claiming active truth is red", () => {
  const report = assertActiveHistoricalTruthTypingRequired({
    ...admissibleInput(),
    projection: { status: "ACTIVE_TRUTH" },
  });

  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "PROJECTION_CLAIMS_ACTIVE_TRUTH"));
});

test("status surface claiming truth source is red", () => {
  const report = assertActiveHistoricalTruthTypingRequired({
    ...admissibleInput(),
    statusSurface: { truth_source: true },
  });

  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "STATUS_SURFACE_CLAIMS_TRUTH_SOURCE"));
});

test("historical snapshot impersonating active truth is red", () => {
  const report = assertActiveHistoricalTruthTypingRequired({
    ...admissibleInput(),
    historicalSnapshot: {
      status: "ACTIVE_TRUTH",
      historical_status: "HISTORICAL_SNAPSHOT",
    },
  });

  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "HISTORICAL_SNAPSHOT_CLAIMS_ACTIVE_TRUTH"));
});
