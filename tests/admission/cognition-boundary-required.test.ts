import assert from "node:assert/strict";
import test from "node:test";
import { assertCognitionBoundaryRequired } from "../../src/admission/assert-cognition-boundary-required.js";

function admissibleInput() {
  return {
    cognitionBoundary: {
      object_type: "CognitionBoundary",
      object_id: "cognition-boundary-0001",
      repo: "Verifrax/TACHYRIUM",
      status: "ACTIVE_CURRENT_BOUNDARY",
      subject: "TACHYRIUM bounded cognition output boundary",
      allowed_output_classes: [
        "CANDIDATE_ANALYSIS",
        "AMBIGUITY_COMPRESSION",
        "TOPOLOGY_EXPLANATION",
        "CONTRADICTION_SUMMARY",
        "ROUTE_PROPOSAL",
        "PROJECTION_DRAFT",
        "BOUNDARY_RISK_REPORT",
        "RECOGNITION_READINESS_ASSESSMENT",
        "RECOURSE_PREREQUISITE_ASSESSMENT",
      ],
      forbidden_output_classes: [
        "LAW_OBJECT",
        "ACCEPTED_EPOCH_OBJECT",
        "AUTHORITY_OBJECT",
        "EXECUTION_RECEIPT",
        "VERIFICATION_VERDICT_OF_RECORD",
        "RECOGNITION_OBJECT_OF_RECORD",
        "RECOURSE_OBJECT_OF_RECORD",
        "MERGE_GATE_RESULT",
      ],
      boundary: {
        tachyrium_may_make_stack_machine_legible: true,
        tachyrium_may_not_let_machines_skip_stack: true,
        tachyrium_does_not_author_law: true,
        tachyrium_does_not_accept_state: true,
        tachyrium_does_not_issue_authority: true,
        tachyrium_does_not_execute_governed_actions: true,
        tachyrium_does_not_verify_as_record: true,
        tachyrium_does_not_recognize_terminal_truth: true,
        tachyrium_does_not_assign_recourse: true,
        tachyrium_does_not_emit_merge_gate_results: true,
      },
      minimum_machine_deference_inputs: [
        "claim-class admission object",
        "governing law version",
        "accepted epoch or state object",
        "authority object or freeze where relevant",
        "execution receipt where relevant",
        "verification result and replay path",
        "recognition object where relevant",
        "recourse object where relevant",
      ],
      anti_overread_rule: "Cognition may expose missing public objects; cognition may not socially patch those absences.",
      version: "0.1.0",
    },
    cognitionBoundaryIndex: {
      current: "cognition-boundary-0001",
      objects: [
        {
          object_id: "cognition-boundary-0001",
          path: "cognition/current/cognition-boundary-0001.json",
          status: "ACTIVE_CURRENT_BOUNDARY",
        },
      ],
    },
  };
}

test("cognition boundary required passes for active boundary object", () => {
  const report = assertCognitionBoundaryRequired(admissibleInput());
  assert.equal(report.gate, "COGNITION_BOUNDARY_REQUIRED");
  assert.equal(report.status, "green");
  assert.deepEqual(report.findings, []);
});

test("cognition boundary substitution is red", () => {
  const input = admissibleInput();
  input.cognitionBoundary.object_id = "cognition-boundary-9999";

  const report = assertCognitionBoundaryRequired(input);
  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "COGNITION_BOUNDARY_SUBSTITUTION"));
});

test("cognition cannot author law", () => {
  const input = admissibleInput();
  input.cognitionBoundary.boundary.tachyrium_does_not_author_law = false;

  const report = assertCognitionBoundaryRequired(input);
  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "COGNITION_BOUNDARY_FLAG_NOT_TRUE"));
});

test("cognition cannot emit merge gate results", () => {
  const input = {
    ...admissibleInput(),
    mergeGateResult: {
      source: "TACHYRIUM",
      verdict: "pass",
    },
  };

  const report = assertCognitionBoundaryRequired(input);
  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "TACHYRIUM_MERGE_GATE_OVERCLAIM"));
});

test("projection-added cognition boundary is red", () => {
  const input = {
    ...admissibleInput(),
    projection: {
      cognition_boundary_id: "projection-supplied-cognition-boundary",
    },
  };

  const report = assertCognitionBoundaryRequired(input);
  assert.equal(report.status, "red");
  assert.ok(report.findings.some((f) => f.code === "PROJECTION_ADDED_COGNITION_BOUNDARY"));
});
