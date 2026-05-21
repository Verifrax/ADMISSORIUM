import assert from "node:assert/strict";
import test from "node:test";
import { loadJson } from "../../src/policy/load-policy.js";
import { evaluateProtectedTruthPaths } from "../../src/firewall/protected-truth-firewall.js";

const policy = loadJson("policies/protected-truth-paths.json");

test("protected truth path blocks projection repair", () => {
  const result = evaluateProtectedTruthPaths({
    changedPaths: ["state/current/root.json", "README.md"],
    policy
  });

  assert.equal(result.verdict, "BLOCKED_PROTECTED_TRUTH_PATH");
  assert.equal(result.protected_truth_touched, true);
  assert.equal(result.automatic_projection_repair_allowed, false);
  assert.equal(result.direct_write_allowed, false);
});

test("ordinary projection path passes firewall", () => {
  const result = evaluateProtectedTruthPaths({
    changedPaths: ["public/index.html", "docs/README.md"],
    policy
  });

  assert.equal(result.verdict, "PROTECTED_TRUTH_FIREWALL_PASS");
  assert.equal(result.protected_truth_touched, false);
});
