import crypto from "node:crypto";

export type GitHubWebhookSignatureVerdict =
  | "VALID"
  | "MISSING_SIGNATURE"
  | "UNSUPPORTED_SIGNATURE"
  | "MALFORMED_SIGNATURE"
  | "INVALID";

export type GitHubWebhookEnvelopeVerdict =
  | "ACCEPTED"
  | "REJECTED_SIGNATURE"
  | "REJECTED_MISSING_EVENT"
  | "REJECTED_MISSING_DELIVERY"
  | "REJECTED_INVALID_JSON"
  | "REJECTED_UNSUPPORTED_EVENT";

export interface GitHubWebhookHeaders {
  "x-github-event"?: string;
  "x-github-delivery"?: string;
  "x-hub-signature-256"?: string;
  "user-agent"?: string;
}

export interface SignatureVerification {
  verdict: GitHubWebhookSignatureVerdict;
  algorithm: "sha256";
  reason: string;
}

export interface GitHubWebhookEnvelope {
  verdict: GitHubWebhookEnvelopeVerdict;
  event?: string;
  delivery?: string;
  action?: string;
  repositoryFullName?: string;
  senderLogin?: string;
  payload?: unknown;
  signature: SignatureVerification;
  writeBehavior: "NONE";
  reason: string;
}

export interface ParseWebhookEnvelopeInput {
  headers: GitHubWebhookHeaders;
  rawBody: Buffer | string;
  webhookSecret: string;
  allowedEvents?: readonly string[];
}

const DEFAULT_ALLOWED_EVENTS = [
  "pull_request",
  "push",
  "check_suite",
  "check_run",
  "workflow_run",
  "issues",
  "issue_comment",
  "repository",
  "release"
] as const;

export function normalizeGitHubWebhookHeaders(headers: Record<string, string | string[] | undefined>): GitHubWebhookHeaders {
  const normalized: GitHubWebhookHeaders = {};
  for (const [rawKey, rawValue] of Object.entries(headers)) {
    const key = rawKey.toLowerCase();
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (typeof value !== "string") continue;
    if (
      key === "x-github-event" ||
      key === "x-github-delivery" ||
      key === "x-hub-signature-256" ||
      key === "user-agent"
    ) {
      normalized[key] = value;
    }
  }
  return normalized;
}

export function computeGitHubWebhookSignature(rawBody: Buffer | string, webhookSecret: string): string {
  return `sha256=${crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex")}`;
}

function safeEqualUtf8(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyGitHubWebhookSignature(
  rawBody: Buffer | string,
  webhookSecret: string,
  receivedSignature: string | undefined
): SignatureVerification {
  if (!receivedSignature) {
    return {
      verdict: "MISSING_SIGNATURE",
      algorithm: "sha256",
      reason: "Missing x-hub-signature-256 header."
    };
  }

  if (!receivedSignature.startsWith("sha256=")) {
    return {
      verdict: "UNSUPPORTED_SIGNATURE",
      algorithm: "sha256",
      reason: "Only GitHub sha256 webhook signatures are accepted."
    };
  }

  const digest = receivedSignature.slice("sha256=".length);
  if (!/^[0-9a-f]{64}$/i.test(digest)) {
    return {
      verdict: "MALFORMED_SIGNATURE",
      algorithm: "sha256",
      reason: "Webhook signature is not a valid sha256 hex digest."
    };
  }

  const expected = computeGitHubWebhookSignature(rawBody, webhookSecret);
  if (!safeEqualUtf8(expected, receivedSignature)) {
    return {
      verdict: "INVALID",
      algorithm: "sha256",
      reason: "Webhook signature does not match payload body."
    };
  }

  return {
    verdict: "VALID",
    algorithm: "sha256",
    reason: "Webhook signature matches payload body."
  };
}

function objectRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function nestedString(record: Record<string, unknown>, first: string, second: string): string | undefined {
  const parent = objectRecord(record[first]);
  if (!parent) return undefined;
  return stringField(parent, second);
}

export function parseGitHubWebhookEnvelope(input: ParseWebhookEnvelopeInput): GitHubWebhookEnvelope {
  const allowedEvents = input.allowedEvents ?? DEFAULT_ALLOWED_EVENTS;
  const signature = verifyGitHubWebhookSignature(
    input.rawBody,
    input.webhookSecret,
    input.headers["x-hub-signature-256"]
  );

  if (signature.verdict !== "VALID") {
    return {
      verdict: "REJECTED_SIGNATURE",
      signature,
      writeBehavior: "NONE",
      reason: signature.reason
    };
  }

  const event = input.headers["x-github-event"];
  if (!event) {
    return {
      verdict: "REJECTED_MISSING_EVENT",
      signature,
      writeBehavior: "NONE",
      reason: "Missing x-github-event header."
    };
  }

  const delivery = input.headers["x-github-delivery"];
  if (!delivery) {
    return {
      verdict: "REJECTED_MISSING_DELIVERY",
      event,
      signature,
      writeBehavior: "NONE",
      reason: "Missing x-github-delivery header."
    };
  }

  if (!allowedEvents.includes(event)) {
    return {
      verdict: "REJECTED_UNSUPPORTED_EVENT",
      event,
      delivery,
      signature,
      writeBehavior: "NONE",
      reason: `Unsupported GitHub webhook event: ${event}`
    };
  }

  let payload: unknown;
  try {
    const raw = Buffer.isBuffer(input.rawBody) ? input.rawBody.toString("utf8") : input.rawBody;
    payload = JSON.parse(raw) as unknown;
  } catch {
    return {
      verdict: "REJECTED_INVALID_JSON",
      event,
      delivery,
      signature,
      writeBehavior: "NONE",
      reason: "Webhook body is not valid JSON."
    };
  }

  const record = objectRecord(payload);
  const envelope: GitHubWebhookEnvelope = {
    verdict: "ACCEPTED",
    event,
    delivery,
    payload,
    signature,
    writeBehavior: "NONE",
    reason: "Webhook envelope accepted for read-only intake."
  };

  if (record) {
    const action = stringField(record, "action");
    const repositoryFullName = nestedString(record, "repository", "full_name");
    const senderLogin = nestedString(record, "sender", "login");

    if (action) envelope.action = action;
    if (repositoryFullName) envelope.repositoryFullName = repositoryFullName;
    if (senderLogin) envelope.senderLogin = senderLogin;
  }

  return envelope;
}
