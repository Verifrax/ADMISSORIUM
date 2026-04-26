import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import { buildActuatorRequestPipelinePlan } from "../../app/actuator-request-pipeline-plan.js";
import type { AdmissibilityReport } from "../../src/types.js";

const secret = "webhook-secret";

function signature(body: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

function headers(event: string, body: string): Record<string, string> {
  return {
    "x-github-event": event,
    "x-github-delivery": "delivery-1",
    "x-hub-signature-256": signature(body)
  };
}

function report(verdict: AdmissibilityReport["verdict"] = "ADMISSIBLE"): AdmissibilityReport {
  return {
    run_id: "pipeline-test",
    started_at: "2026-04-26T00:00:00.000Z",
    org: "Verifrax",
    mode: "audit",
    accepted_graph_ref: "reports/current/accepted-graph.json",
    candidate_graph_ref: "reports/current/candidate-graph.json",
    verdict,
    red_count: verdict === "INADMISSIBLE" ? 1 : 0,
    yellow_count: verdict === "ADMISSIBLE_AS_PROJECTION_REPAIR" ? 1 : 0,
    green_count: verdict === "ADMISSIBLE" ? 1 : 0,
    quarantine_count: 0,
    findings:
      verdict === "ADMISSIBLE_AS_PROJECTION_REPAIR"
        ? [
            {
              finding_id: "YELLOW-PIPELINE-PROJECTION-REPAIR",
              severity: "YELLOW",
              repo: "Verifrax/ADMISSORIUM",
              surface: "docs/generated/projection.md",
              invariant: "projection_repair_allowed",
              expected: "projection artifact present",
              observed: "projection artifact absent",
              source_of_truth: "pipeline-test",
              autofix_allowed: true,
              recommended_action: "Repair non-protected projection artifact."
            }
          ]
        : [],
    repair_plan_ref: "reports/current/repair-plan.json"
  };
}

const pullRequestBody = JSON.stringify({
  action: "synchronize",
  repository: { full_name: "Verifrax/ADMISSORIUM" },
  pull_request: { number: 29, head: { sha: "abc123" } }
});

test("builds full actuator pipeline as plan-only without writes", () => {
  const plan = buildActuatorRequestPipelinePlan({
    request: {
      headers: headers("pull_request", pullRequestBody),
      body: pullRequestBody,
      secret
    },
    report: report()
  });

  assert.equal(plan.decision, "PIPELINE_PLANNED");
  assert.equal(plan.accepted, true);
  assert.equal(plan.repository, "Verifrax/ADMISSORIUM");
  assert.equal(plan.head_sha, "abc123");
  assert.equal(plan.webhook.route_plan?.decision, "DISPATCH_PULL_REQUEST_PLAN");
  assert.equal(plan.installation_token_plan?.token_exchange, "NOT_PERFORMED");
  assert.equal(plan.actuator_orchestration?.write_behavior, "NONE");
  assert.equal(plan.write_behavior, "NONE");
  assert.equal(plan.server_binding, "NONE");
  assert.equal(plan.execution, "PLAN_ONLY");
  assert.equal(plan.token_exchange, "NOT_PERFORMED");
  assert.equal(plan.truth_mutation, false);
  assert.equal(plan.registry_mutation, false);
});

test("denies full pipeline when webhook intake fails", () => {
  const plan = buildActuatorRequestPipelinePlan({
    request: {
      headers: {
        "x-github-event": "pull_request",
        "x-github-delivery": "delivery-2",
        "x-hub-signature-256": "sha256=bad"
      },
      body: pullRequestBody,
      secret
    },
    report: report()
  });

  assert.equal(plan.decision, "PIPELINE_DENIED");
  assert.equal(plan.accepted, false);
  assert.equal(plan.installation_token_plan, null);
  assert.equal(plan.actuator_orchestration, null);
  assert.equal(plan.write_behavior, "NONE");
});

test("denies full pipeline when route dispatch denies event", () => {
  const body = JSON.stringify({ repository: { full_name: "Verifrax/ADMISSORIUM" } });
  const plan = buildActuatorRequestPipelinePlan({
    request: {
      headers: headers("installation", body),
      body,
      secret
    },
    report: report()
  });

  assert.equal(plan.decision, "PIPELINE_DENIED");
  assert.equal(plan.webhook.decision, "DENIED_ROUTE");
  assert.equal(plan.installation_token_plan, null);
  assert.equal(plan.actuator_orchestration, null);
  assert.equal(plan.write_behavior, "NONE");
});

test("pipeline preserves dry-run orchestration for yellow reports", () => {
  const plan = buildActuatorRequestPipelinePlan({
    request: {
      headers: headers("pull_request", pullRequestBody),
      body: pullRequestBody,
      secret
    },
    report: report("ADMISSIBLE_AS_PROJECTION_REPAIR")
  });

  assert.equal(plan.decision, "PIPELINE_PLANNED");
  assert.equal(plan.actuator_orchestration?.projection_repair_pr_plan.required, true);
  assert.equal(plan.actuator_orchestration?.write_behavior, "NONE");
});

test("pipeline keeps emergency stop as route denial", () => {
  const plan = buildActuatorRequestPipelinePlan({
    request: {
      headers: headers("pull_request", pullRequestBody),
      body: pullRequestBody,
      secret,
      env: { ADMISSORIUM_WEBHOOK_DISPATCH_DISABLED: "true" }
    },
    report: report()
  });

  assert.equal(plan.decision, "PIPELINE_DENIED");
  assert.equal(plan.webhook.route_plan?.decision, "DENY_EMERGENCY_STOP");
  assert.equal(plan.write_behavior, "NONE");
});
