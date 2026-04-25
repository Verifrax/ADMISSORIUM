import test from "node:test";
import assert from "node:assert/strict";
import { buildProjectionRepairPrPlan } from "../../app/projection-repair-pr-plan.js";
import {
  writeProjectionRepairPrGuarded,
  type GitHubPullRequestClient
} from "../../app/projection-repair-pr-writer-adapter.js";
import type { AdmissibilityReport, Finding } from "../../src/types.js";

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    finding_id: "YELLOW-PR-WRITER-TEST",
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
    run_id: "admissorium-projection-pr-writer-test",
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

function requiredPlan() {
  return buildProjectionRepairPrPlan({
    report: report(),
    repositoryFullName: "Verifrax/ADMISSORIUM"
  });
}

function notRequiredPlan() {
  return buildProjectionRepairPrPlan({
    report: report({
      verdict: "ADMISSIBLE",
      yellow_count: 0,
      green_count: 1,
      findings: []
    }),
    repositoryFullName: "Verifrax/ADMISSORIUM"
  });
}

function client(): GitHubPullRequestClient & { calls: number } {
  return {
    calls: 0,
    async createPullRequest() {
      this.calls += 1;
      return {
        number: 88,
        html_url: "https://github.com/Verifrax/ADMISSORIUM/pull/88"
      };
    }
  };
}

test("guarded projection repair PR writer skips dry-run plan and does not call client", async () => {
  const fakeClient = client();

  const result = await writeProjectionRepairPrGuarded({
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
  assert.equal(result.request.base, "main");
  assert.match(result.request.head, /^admissorium\/projection-repair-/);
});

test("guarded projection repair PR writer requires explicit executeWrite", async () => {
  const fakeClient = client();
  const executablePlan = { ...requiredPlan(), dry_run: false };

  const result = await writeProjectionRepairPrGuarded({
    plan: executablePlan,
    client: fakeClient,
    executeWrite: false,
    env: {}
  });

  assert.equal(result.verdict, "SKIPPED_DRY_RUN");
  assert.equal(fakeClient.calls, 0);
});

test("guarded projection repair PR writer respects emergency stop before client call", async () => {
  const fakeClient = client();
  const executablePlan = { ...requiredPlan(), dry_run: false };

  const result = await writeProjectionRepairPrGuarded({
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

test("guarded projection repair PR writer skips when repair is not required", async () => {
  const fakeClient = client();
  const executablePlan = { ...notRequiredPlan(), dry_run: false };

  const result = await writeProjectionRepairPrGuarded({
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

test("guarded projection repair PR writer calls client only when all guards pass", async () => {
  const fakeClient = client();
  const executablePlan = { ...requiredPlan(), dry_run: false };

  const result = await writeProjectionRepairPrGuarded({
    plan: executablePlan,
    client: fakeClient,
    executeWrite: true,
    env: {}
  });

  assert.equal(result.verdict, "WRITTEN_PULL_REQUEST");
  assert.equal(result.write_attempted, true);
  assert.equal(result.write_performed, true);
  assert.equal(fakeClient.calls, 1);
  assert.equal(result.result?.number, 88);
});
