import crypto from "node:crypto";

const NO_WRITER_FLAGS = Object.freeze({
  writer_enabled: false,
  webhook_receiver_enabled: false,
  network_listener_enabled: false,
  token_required: false,
  token_persistence_enabled: false,
  check_run_writer_enabled: false,
  pull_request_writer_enabled: false,
  issue_writer_enabled: false,
  contents_write_enabled: false,
  allowed_to_mutate_truth: false
});

function asBuffer(payload) {
  if (Buffer.isBuffer(payload)) return payload;
  if (payload instanceof Uint8Array) return Buffer.from(payload);
  if (typeof payload === "string") return Buffer.from(payload, "utf8");
  return Buffer.from(JSON.stringify(payload), "utf8");
}

function headerValue(headers, key) {
  if (!headers) return "";
  const direct = headers[key] ?? headers[key.toLowerCase()] ?? headers[key.toUpperCase()];
  if (direct !== undefined) return String(direct);
  const found = Object.entries(headers).find(([k]) => k.toLowerCase() === key.toLowerCase());
  return found ? String(found[1]) : "";
}

export function signWebhookPayload({ payload, secret }) {
  if (!secret || typeof secret !== "string") {
    throw new Error("webhook_secret_required_for_local_signature");
  }

  const digest = crypto
    .createHmac("sha256", secret)
    .update(asBuffer(payload))
    .digest("hex");

  return `sha256=${digest}`;
}

export function verifyWebhookSignature({ payload, secret, signature }) {
  const base = {
    verifier: "ADMISSORIUM_WEBHOOK_SIGNATURE_VERIFIER",
    schema_version: "1.0.0",
    truth_warning: "NOT_TRUTH_SOURCE",
    ...NO_WRITER_FLAGS,
    signature_algorithm: "sha256",
    signature_valid: false,
    accepted: false,
    reason: "unverified"
  };

  if (!secret || typeof secret !== "string") {
    return { ...base, reason: "missing_webhook_secret" };
  }

  if (!signature || typeof signature !== "string") {
    return { ...base, reason: "missing_signature" };
  }

  if (!signature.startsWith("sha256=")) {
    return { ...base, reason: "unsupported_signature_algorithm" };
  }

  const actualHex = signature.slice("sha256=".length).trim();
  if (!/^[0-9a-f]{64}$/i.test(actualHex)) {
    return { ...base, reason: "malformed_signature" };
  }

  const expected = signWebhookPayload({ payload, secret });
  const expectedHex = expected.slice("sha256=".length);

  const actual = Buffer.from(actualHex, "hex");
  const wanted = Buffer.from(expectedHex, "hex");

  const signature_valid = actual.length === wanted.length && crypto.timingSafeEqual(actual, wanted);

  return {
    ...base,
    signature_valid,
    accepted: signature_valid,
    reason: signature_valid ? "signature_valid" : "signature_mismatch"
  };
}

export function verifyWebhookEnvelope({ headers, payload, secret }) {
  const signature = headerValue(headers, "x-hub-signature-256");
  const event = headerValue(headers, "x-github-event");
  const delivery = headerValue(headers, "x-github-delivery");

  const signatureResult = verifyWebhookSignature({ payload, secret, signature });

  const event_present = Boolean(event);
  const delivery_id_present = Boolean(delivery);
  const accepted = Boolean(signatureResult.signature_valid && event_present && delivery_id_present);

  let reason = signatureResult.reason;
  if (signatureResult.signature_valid && !event_present) reason = "missing_event";
  if (signatureResult.signature_valid && event_present && !delivery_id_present) reason = "missing_delivery_id";
  if (accepted) reason = "webhook_envelope_valid";

  return {
    ...signatureResult,
    event,
    delivery,
    event_present,
    delivery_id_present,
    accepted,
    reason
  };
}

export function assertNoWebhookWriterSurface(result) {
  const writerFlags = [
    "writer_enabled",
    "webhook_receiver_enabled",
    "network_listener_enabled",
    "token_required",
    "token_persistence_enabled",
    "check_run_writer_enabled",
    "pull_request_writer_enabled",
    "issue_writer_enabled",
    "contents_write_enabled",
    "allowed_to_mutate_truth"
  ];

  const violations = writerFlags.filter((flag) => result[flag] !== false);
  if (violations.length) {
    throw new Error(`webhook_verifier_writer_surface_violation:${violations.join(",")}`);
  }

  return true;
}
