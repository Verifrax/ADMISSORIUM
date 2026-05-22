import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { writeJsonReport } from "../../src/report/write-json-report.js";

test("local report writer emits current and immutable history snapshot", () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "admissorium-report-"));
  const result = writeJsonReport({
    name: "admissorium-v020-test-report",
    rootDir,
    runId: "test-run-0001",
    report: {
      state: "PASS",
      writer_enabled: false,
      allowed_to_mutate_truth: false
    }
  });

  assert.ok(fs.existsSync(result.currentPath));
  assert.ok(fs.existsSync(result.historyPath));
  assert.ok(fs.existsSync(result.manifestPath));

  const current = JSON.parse(fs.readFileSync(result.currentPath, "utf8"));
  const manifest = JSON.parse(fs.readFileSync(result.manifestPath, "utf8"));

  assert.equal(current.truth_warning, "NOT_TRUTH_SOURCE");
  assert.equal(current.writer_enabled, false);
  assert.equal(current.allowed_to_mutate_truth, false);
  assert.equal(manifest.report_name, "admissorium-v020-test-report");
  assert.equal(manifest.payload_hash_sha256, current.payload_hash_sha256);
});

test("local report writer rejects writer-enabled reports", () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "admissorium-report-"));

  assert.throws(() => writeJsonReport({
    name: "bad-report",
    rootDir,
    runId: "test-run-0002",
    report: {
      state: "BAD",
      writer_enabled: true
    }
  }), /report_writer_forbidden_true_flag:writer_enabled/);
});
