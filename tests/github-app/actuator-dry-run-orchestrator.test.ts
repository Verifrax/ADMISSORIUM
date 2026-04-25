import test from "node:test";
import assert from "node:assert/strict";
import { orchestrateActuatorDryRun } from "../../app/actuator-dry-run-orchestrator.js";
import type { AdmissibilityReport, Finding } from "../../src/types.js";

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    finding_id: "YELLOW-ORCH-TEST",
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
    run_id: "admissorium-actuator-dry-run-test",
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

test("orchestrates dry-run actuator plans without write behavior for admissible report", () => {
  const result = orchestrateActuatorDryRun({
    report: report(),
    repositoryFullName: "Verifrax/ADMISSORIUM",
    headSha: "abc123"
  });

  assert.equal(result.dry_run, true);
  assert.equal(result.write_behavior, "NONE");
  assert.equal(result.repository, "Verifrax/ADMISSORIUM");
  assert.equal(result.head_sha, "abc123");
  assert.equal(result.check_run_plan.dry_run, true);
  assert.equal(result.projection_repair_pr_plan.dry_run, true);
  assert.equal(result.quarantine_issue_plan.dry_run, true);
  assert.equal(result.summary.check_run_conclusion, "success");
  assert.equal(result.summary.projection_repair_required, false);
  assert.equal(result.summary.quarantine_issue_required, false);
});

test("orchestrates projection repair plan for autofixable yellow report", () => {
  const result = orchestrateActuatorDryRun({
    report: report({
      verdict: "ADMISSIBLE_AS_PROJECTION_REPAIR",
      yellow_count: 1,
      green_count: 0,
      findings: [finding()]
    }),
    repositoryFullName: "Verifrax/ADMISSORIUM",
    headSha: "abc123"
  });

  assert.equal(result.dry_run, true);
  assert.equal(result.write_behavior, "NONE");
  assert.equal(result.summary.check_run_conclusion, "success");
  assert.equal(result.summary.projection_repair_required, true);
  assert.equal(result.summary.projection_repair_change_count, 1);
  assert.equal(result.summary.quarantine_issue_required, false);
});

test("orchestrates quarantine issue plan for quarantined report", () => {
  const result = orchestrateActuatorDryRun({
    report: report({
      verdict: "QUARANTINED",
      red_count: 1,
      green_count: 0,
      quarantine_count: 1,
      findings: [finding({
        finding_id: "RED-QUARANTINE-ORCH-TEST",
        severity: "RED",
        surface: "receipts/current/collision.json",
        autofix_allowed: false,
        recommended_action: "quarantine receipt collision"
      })]
    }),
    repositoryFullName: "Verifrax/ADMISSORIUM",
    headSha: "abc123"
  });

  assert.equal(result.dry_run, true);
  assert.equal(result.write_behavior, "NONE");
  assert.equal(result.summary.check_run_conclusion, "failure");
  assert.equal(result.summary.projection_repair_required, false);
  assert.equal(result.summary.quarantine_issue_required, true);
  assert.equal(result.summary.quarantine_finding_count, 1);
});

test("records emergency stop state without invoking write adapters", () => {
  const result = orchestrateActuatorDryRun({
    report: report(),
    repositoryFullName: "Verifrax/ADMISSORIUM",
    headSha: "abc123",
    env: { ADMISSORIUM_WRITE_DISABLED: "true" }
  });

  assert.equal(result.dry_run, true);
  assert.equal(result.write_behavior, "NONE");
  assert.equal(result.summary.write_disabled, true);
  assert.equal(result.check_run_plan.write_behavior, "NONE");
});
