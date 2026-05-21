import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { compileOperatorReviewBundle } from "../../src/operator/compile-operator-review-bundle.js";
import { verifySignedObject } from "../../src/signing/deterministic-local-signing.js";

test("operator review bundle is signed, non-sovereign, and no-writer", () => {
  execFileSync("node", ["src/v020/route-quarantine-repair.js"], { stdio: "ignore" });
  const suite = JSON.parse(fs.readFileSync("reports/current/v020-quarantine-repair-suite.json", "utf8"));
  const bundle = compileOperatorReviewBundle(suite, { generated_at: "1970-01-01T00:00:00.000Z" });

  assert.equal(bundle.bundle_type, "ADMISSORIUM_OPERATOR_REVIEW_BUNDLE");
  assert.equal(bundle.mode, "OPERATOR_REVIEW_ONLY");
  assert.equal(bundle.truth_warning, "NOT_TRUTH_SOURCE");
  assert.equal(bundle.total, 5);
  assert.equal(bundle.quarantined, 4);
  assert.equal(bundle.passed_without_quarantine, 1);
  assert.equal(bundle.writer_enabled, false);
  assert.equal(bundle.webhook_enabled, false);
  assert.equal(bundle.check_run_writer_enabled, false);
  assert.equal(bundle.pr_writer_enabled, false);
  assert.equal(bundle.issue_writer_enabled, false);
  assert.equal(bundle.allowed_to_mutate_truth, false);
  assert.equal(verifySignedObject(bundle), true);
});

test("operator bundle exposes only human review actions", () => {
  execFileSync("node", ["src/v020/route-quarantine-repair.js"], { stdio: "ignore" });
  const suite = JSON.parse(fs.readFileSync("reports/current/v020-quarantine-repair-suite.json", "utf8"));
  const bundle = compileOperatorReviewBundle(suite, { generated_at: "1970-01-01T00:00:00.000Z" });

  assert.ok(bundle.allowed_operator_actions.includes("review_private_quarantine"));
  assert.ok(bundle.forbidden_automated_actions.includes("open_pull_request"));
  assert.ok(bundle.forbidden_automated_actions.includes("open_issue"));
  assert.ok(bundle.forbidden_automated_actions.includes("write_check_run"));
  assert.ok(bundle.forbidden_automated_actions.includes("call_webhook"));
  assert.ok(bundle.forbidden_automated_actions.includes("mutate_truth"));
});
