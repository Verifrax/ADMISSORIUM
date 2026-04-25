import test from "node:test";
import assert from "node:assert/strict";
import { buildQuarantineIssuePlan } from "../../app/quarantine-issue-plan.js";
import type { AdmissibilityReport, Finding } from "../../src/types.js";

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    finding_id: "QUARANTINE-TEST",
    severity: "RED",
    repo: "ADMISSORIUM",
    surface: "receipt",
    invariant: "receipt-identity",
    expected: "single canonical body",
    observed: "collision",
    source_of_truth: "accepted graph",
    autofix_allowed: false,
    recommended_action: "quarantine conflicting materialization",
    ...overrides
  };
}

function report(overrides: Partial<AdmissibilityReport> = {}): AdmissibilityReport {
  return {
    run_id: "admissorium-quarantine-test",
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

test("builds no-write issue plan when quarantine is required", () => {
  const plan = buildQuarantineIssuePlan({
    report: report({
      verdict: "INADMISSIBLE",
      red_count: 1,
      green_count: 0,
      quarantine_count: 1,
      findings: [finding()]
    }),
    repositoryFullName: "Verifrax/ADMISSORIUM"
  });

  assert.equal(plan.dry_run, true);
  assert.equal(plan.write_behavior, "NONE");
  assert.equal(plan.required, true);
  assert.equal(plan.repository, "Verifrax/ADMISSORIUM");
  assert.equal(plan.finding_count, 1);
  assert.match(plan.title, /quarantine review required/);
  assert.match(plan.body, /ADMISSORIUM does not decide truth/);
  assert.match(plan.body, /No GitHub issue is created/);
  assert.match(plan.body, /QUARANTINE-TEST/);
  assert.deepEqual(plan.labels, ["admissorium", "quarantine", "governance-review"]);
});

test("builds no-op issue plan when quarantine is not required", () => {
  const plan = buildQuarantineIssuePlan({
    report: report(),
    repositoryFullName: "Verifrax/ADMISSORIUM"
  });

  assert.equal(plan.dry_run, true);
  assert.equal(plan.write_behavior, "NONE");
  assert.equal(plan.required, false);
  assert.equal(plan.finding_count, 0);
  assert.match(plan.title, /not required/);
  assert.match(plan.body, /None/);
});

test("allows caller-supplied labels without changing write boundary", () => {
  const plan = buildQuarantineIssuePlan({
    report: report({
      findings: [finding({
        finding_id: "RED-QUARANTINE-LABEL",
        recommended_action: "quarantine public drift"
      })]
    }),
    repositoryFullName: "Verifrax/ADMISSORIUM",
    labels: ["custom", "quarantine"]
  });

  assert.equal(plan.dry_run, true);
  assert.equal(plan.write_behavior, "NONE");
  assert.equal(plan.required, true);
  assert.deepEqual(plan.labels, ["custom", "quarantine"]);
});
