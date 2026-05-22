import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const FORBIDDEN_TRUE_FLAGS = [
  "writer_enabled",
  "webhook_enabled",
  "check_run_writer_enabled",
  "pull_request_writer_enabled",
  "issue_writer_enabled",
  "contents_write_enabled",
  "package_publish_enabled",
  "allowed_to_mutate_truth",
  "network_enabled",
  "token_persistence_enabled"
];

export function stableJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function assertReportOnly(report) {
  for (const flag of FORBIDDEN_TRUE_FLAGS) {
    if (report?.[flag] === true) {
      throw new Error(`report_writer_forbidden_true_flag:${flag}`);
    }
  }
}

export function writeJsonReport({
  name,
  report,
  rootDir = process.cwd(),
  runId = new Date().toISOString().replace(/[:.]/g, "-")
}) {
  if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(name)) {
    throw new Error(`invalid_report_name:${name}`);
  }

  assertReportOnly(report);

  const envelopeWithoutHash = {
    report_writer: "ADMISSORIUM_LOCAL_JSON_REPORT_WRITER",
    schema_version: "1.0.0",
    truth_warning: "NOT_TRUTH_SOURCE",
    writer_enabled: false,
    webhook_enabled: false,
    check_run_writer_enabled: false,
    pull_request_writer_enabled: false,
    issue_writer_enabled: false,
    contents_write_enabled: false,
    package_publish_enabled: false,
    allowed_to_mutate_truth: false,
    network_enabled: false,
    token_persistence_enabled: false,
    generated_at: new Date().toISOString(),
    run_id: runId,
    report
  };

  const payload_hash_sha256 = sha256(stableJson(envelopeWithoutHash));
  const envelope = { ...envelopeWithoutHash, payload_hash_sha256 };

  const currentDir = path.join(rootDir, "reports", "current");
  const historyDir = path.join(rootDir, "reports", "history", `${name}-${runId}`);
  fs.mkdirSync(currentDir, { recursive: true });
  fs.mkdirSync(historyDir, { recursive: true });

  const currentPath = path.join(currentDir, `${name}.json`);
  const historyPath = path.join(historyDir, `${name}.json`);
  const manifestPath = path.join(historyDir, "manifest.json");

  const serialized = `${JSON.stringify(envelope, null, 2)}\n`;
  fs.writeFileSync(currentPath, serialized);
  fs.writeFileSync(historyPath, serialized);

  const manifest = {
    manifest: "ADMISSORIUM_REPORT_HISTORY_MANIFEST",
    schema_version: "1.0.0",
    truth_warning: "NOT_TRUTH_SOURCE",
    writer_enabled: false,
    webhook_enabled: false,
    check_run_writer_enabled: false,
    pull_request_writer_enabled: false,
    issue_writer_enabled: false,
    contents_write_enabled: false,
    package_publish_enabled: false,
    allowed_to_mutate_truth: false,
    network_enabled: false,
    token_persistence_enabled: false,
    run_id: runId,
    current_path: currentPath,
    history_path: historyPath,
    report_name: name,
    report_sha256: sha256(serialized),
    payload_hash_sha256
  };

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  return { envelope, currentPath, historyPath, manifestPath };
}
