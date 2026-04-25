import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { buildActuatorReadiness } from "../../reports/actuator-readiness.js";

function touch(root: string, path: string): void {
  const full = join(root, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, "x");
}

function completeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "admissorium-actuator-readiness-"));
  for (const path of [
    "policies/permission-policy.json",
    "policies/protected-paths.json",
    "docs/emergency-stop.md",
    "app/webhook-intake.ts",
    "tests/github-app/webhook-intake.test.ts",
    "app/check-run-plan.ts",
    "tests/github-app/check-run-plan.test.ts",
    "app/check-run-writer-adapter.ts",
    "tests/github-app/check-run-writer-adapter.test.ts",
    "app/quarantine-issue-plan.ts",
    "tests/github-app/quarantine-issue-plan.test.ts",
    "app/quarantine-issue-writer-adapter.ts",
    "tests/github-app/quarantine-issue-writer-adapter.test.ts",
    "app/projection-repair-pr-plan.ts",
    "tests/github-app/projection-repair-pr-plan.test.ts",
    "app/projection-repair-pr-writer-adapter.ts",
    "tests/github-app/projection-repair-pr-writer-adapter.test.ts",
    "app/actuator-dry-run-orchestrator.ts",
    "tests/github-app/actuator-dry-run-orchestrator.test.ts"
  ]) {
    touch(root, path);
  }
  return root;
}

test("passes v0.2.0 actuator readiness when boundary objects exist", () => {
  const report = buildActuatorReadiness({ root: completeRoot() });

  assert.equal(report.version, "0.2.0");
  assert.equal(report.ready, true);
  assert.equal(report.failed_count, 0);
  assert.equal(report.passed_count, 12);
});

test("fails v0.2.0 actuator readiness when token exchange is materialized", () => {
  const root = completeRoot();
  touch(root, "app/installation-token.ts");

  const report = buildActuatorReadiness({ root });

  assert.equal(report.ready, false);
  assert.equal(report.failed_count, 1);
  assert.equal(report.criteria.find((item) => item.id === "V020-012")?.status, "FAIL");
});
