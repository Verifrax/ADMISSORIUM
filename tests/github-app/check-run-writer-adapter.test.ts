import test from "node:test";
import assert from "node:assert/strict";
import { buildCheckRunPlan } from "../../app/check-run-plan.js";
import { writeGitHubCheckRunGuarded, type GitHubCheckRunClient } from "../../app/check-run-writer-adapter.js";
import type { AdmissibilityReport } from "../../src/types.js";

function report(): AdmissibilityReport {
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
    repair_plan_ref: "reports/current/repair-plan.json"
  };
}

function client(): GitHubCheckRunClient & { calls: number } {
  return {
    calls: 0,
    async createCheckRun() {
      this.calls += 1;
      return {
        id: 123,
        html_url: "https://github.com/Verifrax/ADMISSORIUM/runs/123"
      };
    }
  };
}

function plan() {
  return buildCheckRunPlan({
    report: report(),
    headSha: "abc123",
    repositoryFullName: "Verifrax/ADMISSORIUM",
    detailsUrl: "https://github.com/Verifrax/ADMISSORIUM/actions/runs/1",
    env: {}
  });
}

test("guarded check-run writer skips dry-run plan and does not call client", async () => {
  const fakeClient = client();

  const result = await writeGitHubCheckRunGuarded({
    plan: plan(),
    client: fakeClient,
    executeWrite: true,
    env: {}
  });

  assert.equal(result.verdict, "SKIPPED_DRY_RUN");
  assert.equal(result.write_attempted, false);
  assert.equal(result.write_performed, false);
  assert.equal(fakeClient.calls, 0);
  assert.equal(result.request?.owner, "Verifrax");
  assert.equal(result.request?.repo, "ADMISSORIUM");
  assert.equal(result.request?.name, "admissorium-admissibility");
});

test("guarded check-run writer requires explicit executeWrite", async () => {
  const fakeClient = client();
  const executablePlan = { ...plan(), dry_run: false as true };

  const result = await writeGitHubCheckRunGuarded({
    plan: executablePlan,
    client: fakeClient,
    executeWrite: false,
    env: {}
  });

  assert.equal(result.verdict, "SKIPPED_DRY_RUN");
  assert.equal(fakeClient.calls, 0);
});

test("guarded check-run writer respects emergency stop before client call", async () => {
  const fakeClient = client();
  const executablePlan = { ...plan(), dry_run: false as true };

  const result = await writeGitHubCheckRunGuarded({
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

test("guarded check-run writer respects permission denial before client call", async () => {
  const fakeClient = client();
  const executablePlan = {
    ...plan(),
    dry_run: false as true,
    permission_decision: {
      decision: "DENY_WRITE_DISABLED" as const,
      reason: "blocked by test"
    }
  };

  const result = await writeGitHubCheckRunGuarded({
    plan: executablePlan,
    client: fakeClient,
    executeWrite: true,
    env: {}
  });

  assert.equal(result.verdict, "SKIPPED_PERMISSION_DENIED");
  assert.equal(fakeClient.calls, 0);
});

test("guarded check-run writer calls client only when all guards pass", async () => {
  const fakeClient = client();
  const executablePlan = { ...plan(), dry_run: false as true };

  const result = await writeGitHubCheckRunGuarded({
    plan: executablePlan,
    client: fakeClient,
    executeWrite: true,
    env: {}
  });

  assert.equal(result.verdict, "WRITTEN_CHECK_RUN");
  assert.equal(result.write_attempted, true);
  assert.equal(result.write_performed, true);
  assert.equal(fakeClient.calls, 1);
  assert.equal(result.result?.id, 123);
});
