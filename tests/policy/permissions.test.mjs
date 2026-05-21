import assert from "node:assert/strict";
import test from "node:test";
import { loadJson } from "../../src/policy/load-policy.js";
import { evaluateGitHubAppPermissions } from "../../src/policy/evaluate-permissions.js";

const policy = loadJson("policies/github-app-permission-policy.json");

test("minimal intended permissions pass", () => {
  const result = evaluateGitHubAppPermissions({
    policy,
    requested: {
      metadata: "read",
      contents: "read",
      pull_requests: "write",
      issues: "write",
      checks: "write",
      actions: "read",
      pages: "read",
      packages: "read",
      commit_statuses: "write"
    }
  });

  assert.equal(result.verdict, "PERMISSION_POLICY_PASS");
  assert.equal(result.forbidden.length, 0);
});

test("contents write is blocked", () => {
  const result = evaluateGitHubAppPermissions({
    policy,
    requested: {
      metadata: "read",
      contents: "write"
    }
  });

  assert.equal(result.verdict, "BLOCKED_PERMISSION_EXPANSION");
  assert.equal(result.forbidden[0].name, "contents");
});
