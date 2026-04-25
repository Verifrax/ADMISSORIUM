import test from "node:test";
import assert from "node:assert/strict";
import { checkRunConclusion } from "../../app/check-run-writer.js";
import type { AdmissibilityReport } from "../../src/types.js";

function report(overrides: Partial<AdmissibilityReport>): AdmissibilityReport {
  return {
    run_id: "r",
    started_at: "now",
    org: "Verifrax",
    mode: "audit",
    accepted_graph_ref: "a",
    candidate_graph_ref: "c",
    verdict: "ADMISSIBLE",
    red_count: 0,
    yellow_count: 0,
    green_count: 1,
    quarantine_count: 0,
    findings: [],
    repair_plan_ref: "p",
    ...overrides
  };
}

test("red report fails check", () => {
  assert.equal(checkRunConclusion(report({
    verdict: "INADMISSIBLE",
    red_count: 1,
    green_count: 0
  })), "failure");
});

test("projection repair report succeeds check", () => {
  assert.equal(checkRunConclusion(report({
    verdict: "ADMISSIBLE_AS_PROJECTION_REPAIR",
    yellow_count: 1,
    green_count: 0
  })), "success");
});

test("governance review report is neutral", () => {
  assert.equal(checkRunConclusion(report({
    verdict: "REQUIRES_ACCEPTANCE_ACT",
    green_count: 0
  })), "neutral");
});
