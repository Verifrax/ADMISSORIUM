import test from "node:test";
import assert from "node:assert/strict";
import { buildCheckRunPlan } from "../../app/check-run-plan.js";
import type { AdmissibilityReport, Finding } from "../../src/types.js";

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    finding_id: "FINDING-TEST",
    severity: "RED",
    repo: "ADMISSORIUM",
    surface: "test",
    invariant: "test-invariant",
    expected: "expected",
    observed: "observed",
    source_of_truth: "test",
    autofix_allowed: false,
    recommended_action: "test recommended action",
    ...overrides
  };
}

function baseReport(overrides: Partial<AdmissibilityReport> = {}): AdmissibilityReport {
  return {
    run_id: "admissorium-test",
    started_at: "2026-04-25T00:00:00.000Z",
    org: "Verifrax",
    mode: "audit",
    accepted_graph_ref: "reports/current/accepted-graph.json",
    candidate_graph_ref: "reports/current/candidate-graph.json",
    verdict: "ADMISSIBLE",
    red_count: 0,
    yellow_count: 0,
    green_count: 1,
    quarantine_count: 0,
    findings: [],
    repair_plan_ref: "reports/current/repair-plan.json",
    ...overrides
  };
}

test("builds dry-run success check-run plan for admissible report", () => {
  const plan = buildCheckRunPlan({
    report: baseReport(),
    headSha: "abc123",
    repositoryFullName: "Verifrax/ADMISSORIUM",
    detailsUrl: "https://github.com/Verifrax/ADMISSORIUM/actions/runs/1",
    env: {}
  });

  assert.equal(plan.dry_run, true);
  assert.equal(plan.write_behavior, "NONE");
  assert.equal(plan.name, "admissorium-admissibility");
  assert.equal(plan.repository, "Verifrax/ADMISSORIUM");
  assert.equal(plan.head_sha, "abc123");
  assert.equal(plan.status, "completed");
  assert.equal(plan.conclusion, "success");
  assert.equal(plan.merge_verdict.verdict, "PASS");
  assert.equal(plan.merge_verdict.merge_allowed, true);
  assert.equal(plan.permission_decision.decision, "ALLOW");
  assert.equal(plan.details_url, "https://github.com/Verifrax/ADMISSORIUM/actions/runs/1");
  assert.match(plan.text, /ADMISSORIUM does not decide truth/);
});

test("builds dry-run failure check-run plan for red report", () => {
  const plan = buildCheckRunPlan({
    report: baseReport({
      verdict: "INADMISSIBLE",
      red_count: 1,
      green_count: 0,
      findings: [finding({
        finding_id: "RED-TEST",
        severity: "RED",
        recommended_action: "block inadmissible materialization"
      })]
    }),
    headSha: "def456",
    repositoryFullName: "Verifrax/ADMISSORIUM",
    env: {}
  });

  assert.equal(plan.conclusion, "failure");
  assert.equal(plan.merge_verdict.verdict, "BLOCKED_BY_CONSTITUTIONAL_DRIFT");
  assert.equal(plan.merge_verdict.merge_allowed, false);
  assert.match(plan.text, /RED-TEST/);
});

test("builds dry-run neutral check-run plan for governance review report", () => {
  const plan = buildCheckRunPlan({
    report: baseReport({
      verdict: "REQUIRES_ACCEPTANCE_ACT",
      yellow_count: 1,
      green_count: 0,
      findings: [finding({
        finding_id: "GOV-TEST",
        severity: "YELLOW",
        recommended_action: "governance review required"
      })]
    }),
    headSha: "ghi789",
    repositoryFullName: "Verifrax/ADMISSORIUM",
    env: {}
  });

  assert.equal(plan.conclusion, "neutral");
  assert.equal(plan.merge_verdict.verdict, "REQUIRES_GOVERNANCE_REVIEW");
  assert.equal(plan.merge_verdict.merge_allowed, false);
});

test("dry-run plan records emergency stop denial without writing", () => {
  const plan = buildCheckRunPlan({
    report: baseReport(),
    headSha: "abc123",
    repositoryFullName: "Verifrax/ADMISSORIUM",
    env: { ADMISSORIUM_WRITE_DISABLED: "true" }
  });

  assert.equal(plan.dry_run, true);
  assert.equal(plan.write_behavior, "NONE");
  assert.equal(plan.conclusion, "success");
  assert.equal(plan.permission_decision.decision, "DENY_WRITE_DISABLED");
});
