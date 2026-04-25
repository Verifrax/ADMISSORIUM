import test from "node:test";
import assert from "node:assert/strict";
import { buildProjectionRepairPrPlan } from "../../app/projection-repair-pr-plan.js";
import type { AdmissibilityReport, Finding } from "../../src/types.js";

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    finding_id: "YELLOW-PROJECTION-TEST",
    severity: "YELLOW",
    repo: "ADMISSORIUM",
    surface: "README.md",
    invariant: "license-consistency",
    expected: "Apache-2.0",
    observed: "missing license sentence",
    source_of_truth: "accepted graph",
    autofix_allowed: true,
    recommended_action: "repair projection metadata",
    ...overrides
  };
}

function report(overrides: Partial<AdmissibilityReport> = {}): AdmissibilityReport {
  return {
    run_id: "admissorium-projection-repair-test",
    started_at: "2026-04-25T00:00:00.000Z",
    org: "Verifrax",
    mode: "audit",
    accepted_graph_ref: "reports/current/accepted-graph.json",
    candidate_graph_ref: "reports/current/candidate-graph.json",
    verdict: "ADMISSIBLE_AS_PROJECTION_REPAIR",
    red_count: 0,
    yellow_count: 1,
    green_count: 0,
    quarantine_count: 0,
    findings: [finding()],
    repair_plan_ref: "reports/current/repair-plan.json",
    ...overrides
  };
}

test("builds no-write projection repair PR plan for autofixable yellow findings", () => {
  const plan = buildProjectionRepairPrPlan({
    report: report(),
    repositoryFullName: "Verifrax/ADMISSORIUM"
  });

  assert.equal(plan.dry_run, true);
  assert.equal(plan.write_behavior, "NONE");
  assert.equal(plan.required, true);
  assert.equal(plan.change_count, 1);
  assert.equal(plan.blocked_count, 0);
  assert.equal(plan.base_branch, "main");
  assert.match(plan.head_branch, /^admissorium\/projection-repair-/);
  assert.match(plan.title, /projection repair/);
  assert.match(plan.body, /ADMISSORIUM does not decide truth/);
  assert.match(plan.body, /No GitHub pull request is created/);
  assert.match(plan.body, /YELLOW-PROJECTION-TEST/);
  assert.deepEqual(plan.labels, ["admissorium", "projection-repair"]);
});

test("does not plan non-autofixable red findings as projection repair", () => {
  const plan = buildProjectionRepairPrPlan({
    report: report({
      verdict: "INADMISSIBLE",
      red_count: 1,
      yellow_count: 0,
      findings: [finding({
        finding_id: "RED-TRUTH-TEST",
        severity: "RED",
        autofix_allowed: false,
        surface: "current/object.json",
        recommended_action: "requires acceptance act"
      })]
    }),
    repositoryFullName: "Verifrax/ADMISSORIUM"
  });

  assert.equal(plan.required, false);
  assert.equal(plan.change_count, 0);
  assert.equal(plan.blocked_count, 0);
  assert.match(plan.title, /not required/);
});

test("blocks protected truth surfaces even when finding claims autofix allowed", () => {
  const plan = buildProjectionRepairPrPlan({
    report: report({
      findings: [finding({
        finding_id: "YELLOW-PROTECTED-TEST",
        surface: "current/accepted-graph.json",
        recommended_action: "repair protected truth projection"
      })]
    }),
    repositoryFullName: "Verifrax/ADMISSORIUM"
  });

  assert.equal(plan.required, false);
  assert.equal(plan.change_count, 0);
  assert.equal(plan.blocked_count, 1);
  assert.match(plan.body, /Blocked protected-surface findings/);
  assert.match(plan.body, /YELLOW-PROTECTED-TEST/);
});

test("allows caller supplied branch and labels without changing write boundary", () => {
  const plan = buildProjectionRepairPrPlan({
    report: report(),
    repositoryFullName: "Verifrax/ADMISSORIUM",
    baseBranch: "release",
    branchPrefix: "custom/repair",
    labels: ["custom", "projection"]
  });

  assert.equal(plan.dry_run, true);
  assert.equal(plan.write_behavior, "NONE");
  assert.equal(plan.base_branch, "release");
  assert.match(plan.head_branch, /^custom\/repair-/);
  assert.deepEqual(plan.labels, ["custom", "projection"]);
});
