import assert from "node:assert/strict";
import test from "node:test";
import {
  signWebhookPayload,
  verifyWebhookSignature,
  verifyWebhookEnvelope,
  assertNoWebhookWriterSurface
} from "../../src/app/webhook-signature.js";

const secret = "ADMISSORIUM_LOCAL_TEST_WEBHOOK_SECRET_NOT_PRODUCTION";
const payload = JSON.stringify({ action: "opened", repository: { full_name: "Verifrax/ADMISSORIUM" } });

test("valid GitHub sha256 webhook signature is accepted", () => {
  const signature = signWebhookPayload({ payload, secret });
  const result = verifyWebhookSignature({ payload, secret, signature });

  assert.equal(result.signature_valid, true);
  assert.equal(result.accepted, true);
  assert.equal(result.reason, "signature_valid");
  assertNoWebhookWriterSurface(result);
});

test("invalid webhook signature is rejected", () => {
  const validSignature = signWebhookPayload({ payload, secret });
  const badNibble = validSignature.endsWith("0") ? "1" : "0";
  const signature = validSignature.slice(0, -1) + badNibble;
  const result = verifyWebhookSignature({ payload, secret, signature });

  assert.equal(result.signature_valid, false);
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "signature_mismatch");
  assertNoWebhookWriterSurface(result);
});

test("malformed or unsupported signature is rejected", () => {
  assert.equal(
    verifyWebhookSignature({ payload, secret, signature: "sha1=abc" }).reason,
    "unsupported_signature_algorithm"
  );

  assert.equal(
    verifyWebhookSignature({ payload, secret, signature: "sha256=nothex" }).reason,
    "malformed_signature"
  );
});

test("webhook envelope requires event and delivery identity", () => {
  const signature = signWebhookPayload({ payload, secret });

  const valid = verifyWebhookEnvelope({
    payload,
    secret,
    headers: {
      "x-hub-signature-256": signature,
      "x-github-event": "pull_request",
      "x-github-delivery": "delivery-1"
    }
  });

  assert.equal(valid.accepted, true);
  assert.equal(valid.reason, "webhook_envelope_valid");
  assertNoWebhookWriterSurface(valid);

  const missingDelivery = verifyWebhookEnvelope({
    payload,
    secret,
    headers: {
      "x-hub-signature-256": signature,
      "x-github-event": "pull_request"
    }
  });

  assert.equal(missingDelivery.accepted, false);
  assert.equal(missingDelivery.reason, "missing_delivery_id");
});

test("webhook verifier does not require tokens, network, or writer side effects", () => {
  const signature = signWebhookPayload({ payload, secret });
  const result = verifyWebhookEnvelope({
    payload,
    secret,
    headers: {
      "x-hub-signature-256": signature,
      "x-github-event": "pull_request",
      "x-github-delivery": "delivery-2"
    }
  });

  assert.equal(result.writer_enabled, false);
  assert.equal(result.webhook_receiver_enabled, false);
  assert.equal(result.network_listener_enabled, false);
  assert.equal(result.token_required, false);
  assert.equal(result.token_persistence_enabled, false);
  assert.equal(result.check_run_writer_enabled, false);
  assert.equal(result.pull_request_writer_enabled, false);
  assert.equal(result.issue_writer_enabled, false);
  assert.equal(result.contents_write_enabled, false);
  assert.equal(result.allowed_to_mutate_truth, false);
});
