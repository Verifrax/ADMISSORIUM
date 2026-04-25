import test from "node:test";
import assert from "node:assert/strict";
import {
  computeGitHubWebhookSignature,
  normalizeGitHubWebhookHeaders,
  parseGitHubWebhookEnvelope,
  verifyGitHubWebhookSignature
} from "../../app/webhook-intake.js";

const secret = "admissorium-test-secret";

function body(): string {
  return JSON.stringify({
    action: "opened",
    repository: { full_name: "Verifrax/ADMISSORIUM" },
    sender: { login: "midiakiasat" },
    pull_request: { number: 15 }
  });
}

test("computes GitHub sha256 webhook signature", () => {
  const raw = body();
  const signature = computeGitHubWebhookSignature(raw, secret);

  assert.match(signature, /^sha256=[0-9a-f]{64}$/);
});

test("accepts valid GitHub webhook signature", () => {
  const raw = body();
  const signature = computeGitHubWebhookSignature(raw, secret);

  assert.deepEqual(verifyGitHubWebhookSignature(raw, secret, signature), {
    verdict: "VALID",
    algorithm: "sha256",
    reason: "Webhook signature matches payload body."
  });
});

test("rejects missing malformed unsupported and invalid signatures", () => {
  const raw = body();

  assert.equal(verifyGitHubWebhookSignature(raw, secret, undefined).verdict, "MISSING_SIGNATURE");
  assert.equal(verifyGitHubWebhookSignature(raw, secret, "sha1=deadbeef").verdict, "UNSUPPORTED_SIGNATURE");
  assert.equal(verifyGitHubWebhookSignature(raw, secret, "sha256=not-hex").verdict, "MALFORMED_SIGNATURE");
  assert.equal(verifyGitHubWebhookSignature(raw, secret, computeGitHubWebhookSignature(raw, "wrong")).verdict, "INVALID");
});

test("normalizes webhook headers case-insensitively", () => {
  const raw = body();
  const signature = computeGitHubWebhookSignature(raw, secret);

  assert.deepEqual(
    normalizeGitHubWebhookHeaders({
      "X-GitHub-Event": "pull_request",
      "X-GitHub-Delivery": "delivery-1",
      "X-Hub-Signature-256": signature,
      "User-Agent": "GitHub-Hookshot/test",
      ignored: "value"
    }),
    {
      "x-github-event": "pull_request",
      "x-github-delivery": "delivery-1",
      "x-hub-signature-256": signature,
      "user-agent": "GitHub-Hookshot/test"
    }
  );
});

test("parses accepted read-only webhook envelope", () => {
  const raw = body();
  const signature = computeGitHubWebhookSignature(raw, secret);

  const envelope = parseGitHubWebhookEnvelope({
    rawBody: raw,
    webhookSecret: secret,
    headers: {
      "x-github-event": "pull_request",
      "x-github-delivery": "delivery-1",
      "x-hub-signature-256": signature
    }
  });

  assert.equal(envelope.verdict, "ACCEPTED");
  assert.equal(envelope.event, "pull_request");
  assert.equal(envelope.delivery, "delivery-1");
  assert.equal(envelope.action, "opened");
  assert.equal(envelope.repositoryFullName, "Verifrax/ADMISSORIUM");
  assert.equal(envelope.senderLogin, "midiakiasat");
  assert.equal(envelope.writeBehavior, "NONE");
});

test("rejects envelope before parsing when signature fails", () => {
  const envelope = parseGitHubWebhookEnvelope({
    rawBody: body(),
    webhookSecret: secret,
    headers: {
      "x-github-event": "pull_request",
      "x-github-delivery": "delivery-1",
      "x-hub-signature-256": "sha256=0000000000000000000000000000000000000000000000000000000000000000"
    }
  });

  assert.equal(envelope.verdict, "REJECTED_SIGNATURE");
  assert.equal(envelope.writeBehavior, "NONE");
});

test("rejects missing event and delivery headers", () => {
  const raw = body();
  const signature = computeGitHubWebhookSignature(raw, secret);

  assert.equal(parseGitHubWebhookEnvelope({
    rawBody: raw,
    webhookSecret: secret,
    headers: {
      "x-github-delivery": "delivery-1",
      "x-hub-signature-256": signature
    }
  }).verdict, "REJECTED_MISSING_EVENT");

  assert.equal(parseGitHubWebhookEnvelope({
    rawBody: raw,
    webhookSecret: secret,
    headers: {
      "x-github-event": "pull_request",
      "x-hub-signature-256": signature
    }
  }).verdict, "REJECTED_MISSING_DELIVERY");
});

test("rejects unsupported event and invalid JSON without write behavior", () => {
  const raw = body();
  const signature = computeGitHubWebhookSignature(raw, secret);

  assert.equal(parseGitHubWebhookEnvelope({
    rawBody: raw,
    webhookSecret: secret,
    headers: {
      "x-github-event": "membership",
      "x-github-delivery": "delivery-1",
      "x-hub-signature-256": signature
    },
    allowedEvents: ["pull_request"]
  }).verdict, "REJECTED_UNSUPPORTED_EVENT");

  const invalid = "{";
  assert.equal(parseGitHubWebhookEnvelope({
    rawBody: invalid,
    webhookSecret: secret,
    headers: {
      "x-github-event": "pull_request",
      "x-github-delivery": "delivery-1",
      "x-hub-signature-256": computeGitHubWebhookSignature(invalid, secret)
    }
  }).verdict, "REJECTED_INVALID_JSON");
});
