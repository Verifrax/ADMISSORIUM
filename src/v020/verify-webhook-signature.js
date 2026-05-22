import fs from "node:fs";
import path from "node:path";
import {
  signWebhookPayload,
  verifyWebhookEnvelope,
  assertNoWebhookWriterSurface
} from "../app/webhook-signature.js";

const SECRET = "ADMISSORIUM_LOCAL_TEST_WEBHOOK_SECRET_NOT_PRODUCTION";
const payload = JSON.stringify({
  action: "opened",
  pull_request: { number: 20, head: { sha: "abc123" } },
  repository: { full_name: "Verifrax/ADMISSORIUM" }
});

const validSignature = signWebhookPayload({ payload, secret: SECRET });

const cases = [
  {
    name: "valid_pull_request_webhook",
    headers: {
      "x-hub-signature-256": validSignature,
      "x-github-event": "pull_request",
      "x-github-delivery": "delivery-0001"
    },
    expected_accepted: true,
    expected_reason: "webhook_envelope_valid"
  },
  {
    name: "bad_signature_rejected",
    headers: {
      "x-hub-signature-256": validSignature.slice(0, -1) + (validSignature.endsWith("0") ? "1" : "0"),
      "x-github-event": "pull_request",
      "x-github-delivery": "delivery-0002"
    },
    expected_accepted: false,
    expected_reason: "signature_mismatch"
  },
  {
    name: "missing_signature_rejected",
    headers: {
      "x-github-event": "pull_request",
      "x-github-delivery": "delivery-0003"
    },
    expected_accepted: false,
    expected_reason: "missing_signature"
  },
  {
    name: "unsupported_algorithm_rejected",
    headers: {
      "x-hub-signature-256": "sha1=ffffffffffffffffffffffffffffffffffffffff",
      "x-github-event": "pull_request",
      "x-github-delivery": "delivery-0004"
    },
    expected_accepted: false,
    expected_reason: "unsupported_signature_algorithm"
  },
  {
    name: "missing_delivery_id_rejected",
    headers: {
      "x-hub-signature-256": validSignature,
      "x-github-event": "pull_request"
    },
    expected_accepted: false,
    expected_reason: "missing_delivery_id"
  },
  {
    name: "missing_event_rejected",
    headers: {
      "x-hub-signature-256": validSignature,
      "x-github-delivery": "delivery-0005"
    },
    expected_accepted: false,
    expected_reason: "missing_event"
  }
];

const results = cases.map((item) => {
  const result = verifyWebhookEnvelope({
    headers: item.headers,
    payload,
    secret: SECRET
  });

  assertNoWebhookWriterSurface(result);

  const pass =
    result.accepted === item.expected_accepted &&
    result.reason === item.expected_reason &&
    result.writer_enabled === false &&
    result.webhook_receiver_enabled === false &&
    result.network_listener_enabled === false &&
    result.token_required === false &&
    result.token_persistence_enabled === false &&
    result.allowed_to_mutate_truth === false;

  return {
    name: item.name,
    pass,
    expected_accepted: item.expected_accepted,
    actual_accepted: result.accepted,
    expected_reason: item.expected_reason,
    actual_reason: result.reason,
    signature_valid: result.signature_valid,
    writer_enabled: result.writer_enabled,
    webhook_receiver_enabled: result.webhook_receiver_enabled,
    network_listener_enabled: result.network_listener_enabled,
    token_required: result.token_required,
    token_persistence_enabled: result.token_persistence_enabled,
    allowed_to_mutate_truth: result.allowed_to_mutate_truth
  };
});

const failed = results.filter((r) => !r.pass);

const report = {
  report_type: "ADMISSORIUM_V020_WEBHOOK_SIGNATURE_VERIFICATION",
  schema_version: "1.0.0",
  state: failed.length === 0 ? "ADMISSORIUM_V020_WEBHOOK_SIGNATURE_VERIFICATION_PASS" : "ADMISSORIUM_V020_WEBHOOK_SIGNATURE_VERIFICATION_FAIL",
  generated_at: new Date().toISOString(),
  truth_warning: "NOT_TRUTH_SOURCE",
  secret_posture: "LOCAL_TEST_SECRET_ONLY_NOT_PRODUCTION",
  writer_enabled: false,
  webhook_receiver_enabled: false,
  network_listener_enabled: false,
  token_required: false,
  token_persistence_enabled: false,
  check_run_writer_enabled: false,
  pull_request_writer_enabled: false,
  issue_writer_enabled: false,
  contents_write_enabled: false,
  allowed_to_mutate_truth: false,
  total: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  results
};

fs.mkdirSync("reports/current", { recursive: true });
fs.mkdirSync("reports/history", { recursive: true });

fs.writeFileSync(
  "reports/current/admissorium-v020-webhook-signature.json",
  JSON.stringify(report, null, 2) + "\n"
);

const stamp = report.generated_at.replace(/[-:]/g, "").replace(/\..+$/, "Z");
const historyDir = path.join("reports/history", `admissorium-v020-webhook-signature-${stamp}`);
fs.mkdirSync(historyDir, { recursive: true });
fs.writeFileSync(path.join(historyDir, "report.json"), JSON.stringify(report, null, 2) + "\n");

if (failed.length) {
  console.error("ADMISSORIUM_V020_WEBHOOK_SIGNATURE_VERIFICATION_FAIL=true");
  console.error(JSON.stringify({ total: report.total, passed: report.passed, failed: report.failed }, null, 2));
  process.exit(1);
}

console.log("ADMISSORIUM_V020_WEBHOOK_SIGNATURE_VERIFICATION_PASS=true");
console.log(JSON.stringify({ total: report.total, passed: report.passed, failed: report.failed }, null, 2));
