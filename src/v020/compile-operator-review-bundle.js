import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { compileOperatorReviewBundle } from "../operator/compile-operator-review-bundle.js";
import { verifySignedObject } from "../signing/deterministic-local-signing.js";

const generated_at = "1970-01-01T00:00:00.000Z";

execFileSync("node", ["src/v020/route-quarantine-repair.js"], { stdio: "inherit" });

const suite = JSON.parse(fs.readFileSync("reports/current/v020-quarantine-repair-suite.json", "utf8"));
const bundle = compileOperatorReviewBundle(suite, { generated_at });

const summary = {
  report_type: "ADMISSORIUM_V020_OPERATOR_REVIEW_BUNDLE_SUITE",
  schema_version: "1.0.0",
  generated_at,
  state: "ADMISSORIUM_V020_OPERATOR_REVIEW_BUNDLE_PASS",
  bundle_signature_ok: verifySignedObject(bundle),
  total: bundle.total,
  quarantined: bundle.quarantined,
  passed_without_quarantine: bundle.passed_without_quarantine,
  failed: bundle.failed,
  writer_enabled: bundle.writer_enabled,
  webhook_enabled: bundle.webhook_enabled,
  check_run_writer_enabled: bundle.check_run_writer_enabled,
  pr_writer_enabled: bundle.pr_writer_enabled,
  issue_writer_enabled: bundle.issue_writer_enabled,
  allowed_to_mutate_truth: bundle.allowed_to_mutate_truth,
  bundle
};

if (
  !summary.bundle_signature_ok ||
  summary.failed !== 0 ||
  summary.writer_enabled !== false ||
  summary.webhook_enabled !== false ||
  summary.check_run_writer_enabled !== false ||
  summary.pr_writer_enabled !== false ||
  summary.issue_writer_enabled !== false ||
  summary.allowed_to_mutate_truth !== false
) {
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

fs.writeFileSync("reports/current/v020-operator-review-bundle.json", JSON.stringify(summary, null, 2) + "\n");
fs.writeFileSync("reports/history/v020-operator-review-bundle.latest.json", JSON.stringify(summary, null, 2) + "\n");

console.log("ADMISSORIUM_V020_OPERATOR_REVIEW_BUNDLE_PASS=true");
console.log(JSON.stringify({
  total: summary.total,
  quarantined: summary.quarantined,
  passed_without_quarantine: summary.passed_without_quarantine,
  bundle_signature_ok: summary.bundle_signature_ok,
  failed: summary.failed
}));
