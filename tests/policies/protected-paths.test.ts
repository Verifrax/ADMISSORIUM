import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadProtectedPathsPolicy, protectedPathClassFor } from "../../app/permissions.js";

test("protected path policy is active and versioned", () => {
  const raw = JSON.parse(fs.readFileSync("policies/protected-paths.json", "utf8")) as {
    schema: string;
    version: string;
    status: string;
    classes: unknown[];
  };

  assert.equal(raw.schema, "admissorium.protected-paths.v1");
  assert.equal(raw.version, "0.2.0-boundary");
  assert.equal(raw.status, "ACTIVE_TRUTH");
  assert.ok(raw.classes.length >= 10);
});

test("all critical sovereign truth families are protected", () => {
  const policy = loadProtectedPathsPolicy();

  const required = new Map([
    ["law/versions/v1.json", "constitutional-law"],
    ["epochs/current/index.json", "accepted-state"],
    ["authorities/current/root.json", "authority"],
    ["receipts/current/receipt.json", "execution-receipts"],
    ["verification/results/current/result.json", "verification-results"],
    ["recognitions/current/object.json", "terminal-recognition"],
    ["recourses/current/object.json", "terminal-recourse"],
    ["claims/current/claim.json", "claims"],
    ["continuity/current/transfer.json", "continuity-transfer"]
  ]);

  for (const [targetPath, expectedClass] of required) {
    assert.equal(protectedPathClassFor(targetPath, policy)?.id, expectedClass);
  }
});

test("ordinary projection files are not classified as protected truth", () => {
  const policy = loadProtectedPathsPolicy();

  assert.equal(protectedPathClassFor("README.md", policy), undefined);
  assert.equal(protectedPathClassFor("docs/emergency-stop.md", policy), undefined);
  assert.equal(protectedPathClassFor("reports/current/merge-verdict.json", policy), undefined);
});
