import assert from "node:assert/strict";
import test from "node:test";
import { dispatchWebhookRoute } from "../../app/webhook-route-dispatcher.js";

const pullRequestPayload = {
  action: "synchronize",
  repository: { full_name: "Verifrax/ADMISSORIUM" },
  pull_request: { number: 27, head: { sha: "abc123" } }
};

const pushPayload = {
  ref: "refs/heads/main",
  after: "def456",
  repository: { full_name: "Verifrax/ADMISSORIUM" }
};

test("dispatches pull request webhook to plan-only execution", () => {
  const plan = dispatchWebhookRoute({ event: "pull_request", delivery: "delivery-1", payload: pullRequestPayload });
  assert.equal(plan.decision, "DISPATCH_PULL_REQUEST_PLAN");
  assert.equal(plan.repository, "Verifrax/ADMISSORIUM");
  assert.equal(plan.target_kind, "pull_request");
  assert.equal(plan.head_sha, "abc123");
  assert.equal(plan.pull_request_number, 27);
  assert.equal(plan.write_behavior, "NONE");
  assert.equal(plan.server_binding, "NONE");
  assert.equal(plan.execution, "PLAN_ONLY");
  assert.equal(plan.token_exchange, "NOT_PERFORMED");
  assert.equal(plan.truth_mutation, false);
  assert.equal(plan.registry_mutation, false);
});

test("dispatches push webhook to plan-only execution", () => {
  const plan = dispatchWebhookRoute({ event: "push", delivery: "delivery-2", payload: pushPayload });
  assert.equal(plan.decision, "DISPATCH_PUSH_PLAN");
  assert.equal(plan.repository, "Verifrax/ADMISSORIUM");
  assert.equal(plan.target_kind, "push");
  assert.equal(plan.head_sha, "def456");
  assert.equal(plan.ref, "refs/heads/main");
  assert.equal(plan.write_behavior, "NONE");
  assert.equal(plan.server_binding, "NONE");
});

test("acknowledges ping without execution", () => {
  const plan = dispatchWebhookRoute({
    event: "ping",
    delivery: "delivery-3",
    payload: { repository: { full_name: "Verifrax/ADMISSORIUM" } }
  });
  assert.equal(plan.decision, "ACKNOWLEDGE_ONLY");
  assert.equal(plan.target_kind, "none");
});

test("denies dispatch when emergency stop is active", () => {
  const plan = dispatchWebhookRoute({
    event: "pull_request",
    delivery: "delivery-4",
    payload: pullRequestPayload,
    env: { ADMISSORIUM_WEBHOOK_DISPATCH_DISABLED: "true" }
  });
  assert.equal(plan.decision, "DENY_EMERGENCY_STOP");
  assert.equal(plan.write_behavior, "NONE");
});

test("denies payloads without repository identity", () => {
  const plan = dispatchWebhookRoute({
    event: "pull_request",
    delivery: "delivery-5",
    payload: { pull_request: { head: { sha: "abc123" } } }
  });
  assert.equal(plan.decision, "DENY_MISSING_REPOSITORY");
  assert.equal(plan.repository, null);
});

test("denies pull request payloads without head sha", () => {
  const plan = dispatchWebhookRoute({
    event: "pull_request",
    delivery: "delivery-6",
    payload: { repository: { full_name: "Verifrax/ADMISSORIUM" }, pull_request: { number: 1, head: {} } }
  });
  assert.equal(plan.decision, "DENY_MISSING_HEAD_SHA");
  assert.equal(plan.target_kind, "pull_request");
});

test("denies unsupported webhook events without writes", () => {
  const plan = dispatchWebhookRoute({
    event: "installation",
    delivery: "delivery-7",
    payload: { repository: { full_name: "Verifrax/ADMISSORIUM" } }
  });
  assert.equal(plan.decision, "DENY_UNSUPPORTED_EVENT");
  assert.equal(plan.write_behavior, "NONE");
  assert.equal(plan.server_binding, "NONE");
  assert.equal(plan.token_exchange, "NOT_PERFORMED");
});
