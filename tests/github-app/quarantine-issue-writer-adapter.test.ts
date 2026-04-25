import test from "node:test";
import assert from "node:assert/strict";
import { buildQuarantineIssuePlan } from "../../app/quarantine-issue-plan.js";
import {
  writeQuarantineIssueGuarded,
  type GitHubIssueClient
} from "../../app/quarantine-issue-writer-adapter.js";
import type { AdmissibilityReport, Finding } from "../../src/types.js";

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    finding_id: "QUARANTINE-WRITER-TEST",
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
    run_id: "admissorium-quarantine-writer-test",
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

function requiredPlan() {
  return buildQuarantineIssuePlan({
    report: report({
      verdict: "INADMISSIBLE",
      red_count: 1,
      green_count: 0,
      quarantine_count: 1,
      findings: [finding()]
    }),
    repositoryFullName: "Verifrax/ADMISSORIUM"
  });
}

function notRequiredPlan() {
  return buildQuarantineIssuePlan({
    report: report(),
    repositoryFullName: "Verifrax/ADMISSORIUM"
  });
}

function client(): GitHubIssueClient & { calls: number } {
  return {
    calls: 0,
    async createIssue() {
      this.calls += 1;
      return {
        number: 77,
        html_url: "https://github.com/Verifrax/ADMISSORIUM/issues/77"
      };
    }
  };
}

test("guarded quarantine issue writer skips dry-run plan and does not call client", async () => {
  const fakeClient = client();

  const result = await writeQuarantineIssueGuarded({
    plan: requiredPlan(),
    client: fakeClient,
    executeWrite: true,
    env: {}
  });

  assert.equal(result.verdict, "SKIPPED_DRY_RUN");
  assert.equal(result.write_attempted, false);
  assert.equal(result.write_performed, false);
  assert.equal(fakeClient.calls, 0);
  assert.equal(result.request.owner, "Verifrax");
  assert.equal(result.request.repo, "ADMISSORIUM");
  assert.match(result.request.title, /quarantine review required/);
});

test("guarded quarantine issue writer requires explicit executeWrite", async () => {
  const fakeClient = client();
  const executablePlan = { ...requiredPlan(), dry_run: false };

  const result = await writeQuarantineIssueGuarded({
    plan: executablePlan,
    client: fakeClient,
    executeWrite: false,
    env: {}
  });

  assert.equal(result.verdict, "SKIPPED_DRY_RUN");
  assert.equal(fakeClient.calls, 0);
});

test("guarded quarantine issue writer respects emergency stop before client call", async () => {
  const fakeClient = client();
  const executablePlan = { ...requiredPlan(), dry_run: false };

  const result = await writeQuarantineIssueGuarded({
    plan: executablePlan,
    client: fakeClient,
    executeWrite: true,
    env: { ADMISSORIUM_WRITE_DISABLED: "true" }
  });

  assert.equal(result.verdict, "SKIPPED_WRITE_DISABLED");
  assert.equal(result.write_attempted, false);
  assert.equal(result.write_performed, false);
  assert.equal(fakeClient.calls, 0);
});

test("guarded quarantine issue writer skips when quarantine issue is not required", async () => {
  const fakeClient = client();
  const executablePlan = { ...notRequiredPlan(), dry_run: false };

  const result = await writeQuarantineIssueGuarded({
    plan: executablePlan,
    client: fakeClient,
    executeWrite: true,
    env: {}
  });

  assert.equal(result.verdict, "SKIPPED_NOT_REQUIRED");
  assert.equal(result.write_attempted, false);
  assert.equal(result.write_performed, false);
  assert.equal(fakeClient.calls, 0);
});

test("guarded quarantine issue writer calls client only when all guards pass", async () => {
  const fakeClient = client();
  const executablePlan = { ...requiredPlan(), dry_run: false };

  const result = await writeQuarantineIssueGuarded({
    plan: executablePlan,
    client: fakeClient,
    executeWrite: true,
    env: {}
  });

  assert.equal(result.verdict, "WRITTEN_ISSUE");
  assert.equal(result.write_attempted, true);
  assert.equal(result.write_performed, true);
  assert.equal(fakeClient.calls, 1);
  assert.equal(result.result?.number, 77);
});
