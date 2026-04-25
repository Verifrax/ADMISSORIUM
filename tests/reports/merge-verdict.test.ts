import test from "node:test";
import assert from "node:assert/strict";
import { buildMergeVerdictArtifact } from "../../reports/merge-verdict.js";
import type { AdmissibilityReport } from "../../src/types.js";

function report(overrides: Partial<AdmissibilityReport>): AdmissibilityReport {
  return {
    run_id: "r",
    started_at: "now",
    org: "Verifrax",
    mode: "audit",
    accepted_graph_ref: "accepted.json",
    candidate_graph_ref: "candidate.json",
    verdict: "ADMISSIBLE",
    red_count: 0,
    yellow_count: 0,
    green_count: 1,
    quarantine_count: 0,
    findings: [],
    repair_plan_ref: "repair.json",
    ...overrides
  };
}

test("admissible report produces pass merge verdict", () => {
  const artifact = buildMergeVerdictArtifact(report({}));

  assert.equal(artifact.verdict, "PASS");
  assert.equal(artifact.merge_allowed, true);
  assert.equal(artifact.check_conclusion, "success");
});

test("yellow report produces projection repair pass verdict", () => {
  const artifact = buildMergeVerdictArtifact(report({
    verdict: "ADMISSIBLE_AS_PROJECTION_REPAIR",
    yellow_count: 1,
    green_count: 0
  }));

  assert.equal(artifact.verdict, "PASS_WITH_PROJECTION_REPAIR");
  assert.equal(artifact.merge_allowed, true);
  assert.equal(artifact.check_conclusion, "success");
});

test("red report produces blocked merge verdict", () => {
  const artifact = buildMergeVerdictArtifact(report({
    verdict: "INADMISSIBLE",
    red_count: 1,
    green_count: 0
  }));

  assert.equal(artifact.verdict, "BLOCKED_BY_CONSTITUTIONAL_DRIFT");
  assert.equal(artifact.merge_allowed, false);
  assert.equal(artifact.check_conclusion, "failure");
});

test("acceptance act report produces governance review verdict", () => {
  const artifact = buildMergeVerdictArtifact(report({
    verdict: "REQUIRES_ACCEPTANCE_ACT",
    green_count: 0
  }));

  assert.equal(artifact.verdict, "REQUIRES_GOVERNANCE_REVIEW");
  assert.equal(artifact.merge_allowed, false);
  assert.equal(artifact.check_conclusion, "neutral");
});
