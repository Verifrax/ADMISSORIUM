import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import { handleWebhookRequest } from "../../app/webhook-request-handler.js";

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

const pullRequestBody = JSON.stringify({
  action: "synchronize",
  repository: { full_name: "Verifrax/ADMISSORIUM" },
  pull_request: { number: 28, head: { sha: "abc123" } }
});

const pushBody = JSON.stringify({
  ref: "refs/heads/main",
  after: "def456",
  repository: { full_name: "Verifrax/ADMISSORIUM" }
});

test("handles verified pull request webhook as route plan only", () => {
  const result = handleWebhookRequest({
    headers: headers("pull_request", pullRequestBody),
    body: pullRequestBody,
    secret
  });

  assert.equal(result.decision, "ROUTED");
  assert.equal(result.accepted, true);
  assert.equal(result.status_code, 202);
  assert.equal(result.envelope?.event, "pull_request");
  assert.equal(result.route_plan?.decision, "DISPATCH_PULL_REQUEST_PLAN");
  assert.equal(result.route_plan?.head_sha, "abc123");
  assert.equal(result.write_behavior, "NONE");
  assert.equal(result.server_binding, "NONE");
  assert.equal(result.execution, "PLAN_ONLY");
  assert.equal(result.token_exchange, "NOT_PERFORMED");
  assert.equal(result.truth_mutation, false);
  assert.equal(result.registry_mutation, false);
});

test("handles verified push webhook as route plan only", () => {
  const result = handleWebhookRequest({
    headers: headers("push", pushBody),
    body: pushBody,
    secret
  });

  assert.equal(result.decision, "ROUTED");
  assert.equal(result.status_code, 202);
  assert.equal(result.route_plan?.decision, "DISPATCH_PUSH_PLAN");
  assert.equal(result.route_plan?.ref, "refs/heads/main");
});

test("rejects invalid signature before route dispatch", () => {
  const result = handleWebhookRequest({
    headers: {
      "x-github-event": "pull_request",
      "x-github-delivery": "delivery-2",
      "x-hub-signature-256": "sha256=bad"
    },
    body: pullRequestBody,
    secret
  });

  assert.equal(result.decision, "DENIED_INTAKE");
  assert.equal(result.accepted, false);
  assert.equal(result.status_code, 401);
  assert.equal(result.envelope, null);
  assert.equal(result.route_plan, null);
  assert.equal(result.write_behavior, "NONE");
});

test("rejects invalid JSON before route dispatch", () => {
  const body = "{";
  const result = handleWebhookRequest({
    headers: headers("pull_request", body),
    body,
    secret
  });

  assert.equal(result.decision, "DENIED_INTAKE");
  assert.equal(result.accepted, false);
  assert.equal(result.status_code, 400);
  assert.equal(result.route_plan, null);
});

test("returns route denial without writes", () => {
  const result = handleWebhookRequest({
    headers: headers("pull_request", pullRequestBody),
    body: pullRequestBody,
    secret,
    env: { ADMISSORIUM_WEBHOOK_DISPATCH_DISABLED: "true" }
  });

  assert.equal(result.decision, "DENIED_ROUTE");
  assert.equal(result.accepted, false);
  assert.equal(result.status_code, 403);
  assert.equal(result.route_plan?.decision, "DENY_EMERGENCY_STOP");
  assert.equal(result.write_behavior, "NONE");
  assert.equal(result.server_binding, "NONE");
});

test("returns unsupported event route denial without writes", () => {
  const body = JSON.stringify({
    repository: { full_name: "Verifrax/ADMISSORIUM" }
  });
  const result = handleWebhookRequest({
    headers: headers("installation", body),
    body,
    secret
  });

  assert.equal(result.decision, "DENIED_ROUTE");
  assert.equal(result.accepted, false);
  assert.equal(result.status_code, 422);
  assert.equal(result.route_plan?.decision, "DENY_UNSUPPORTED_EVENT");
  assert.equal(result.write_behavior, "NONE");
});
