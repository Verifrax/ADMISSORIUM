const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("ADMISSORIUM cannot become truth owner", () => {
  const policy = JSON.parse(fs.readFileSync("policies/admissorium-actuator-policy.json", "utf8"));
  assert.equal(policy.truth_warning, "NOT_TRUTH_SOURCE");
  assert.equal(policy.may_rewrite_current_truth_objects, false);
  assert.equal(policy.may_mutate_law, false);
  assert.equal(policy.may_mutate_accepted_state, false);
  assert.equal(policy.may_issue_authority, false);
  assert.equal(policy.may_verify_as_final_source, false);
  assert.equal(policy.may_recognize_terminal_truth, false);
  assert.equal(policy.may_assign_recourse, false);
});

test("protected truth paths refuse automatic projection repair", () => {
  const policy = JSON.parse(fs.readFileSync("policies/protected-truth-paths.json", "utf8"));
  assert.equal(policy.if_touched.automatic_projection_repair_allowed, false);
  assert.equal(policy.if_touched.direct_write_allowed, false);
  assert.ok(policy.protected_paths.includes("current/**"));
  assert.ok(policy.protected_paths.includes("package.json"));
});

test("emergency stop disables side effects but preserves evidence", () => {
  const policy = JSON.parse(fs.readFileSync("policies/emergency-stop.json", "utf8"));
  assert.equal(policy.environment_switch, "ADMISSORIUM_WRITE_DISABLED");
  assert.ok(policy.when_active_disable.includes("open_pr"));
  assert.ok(policy.when_active_disable.includes("write_remote_side_effect"));
  assert.ok(policy.when_active_preserve.includes("emit_history_snapshot"));
  assert.equal(policy.bypass_allowed, false);
});

test("GitHub App permission policy forbids overbroad write surfaces", () => {
  const policy = JSON.parse(fs.readFileSync("policies/github-app-permission-policy.json", "utf8"));
  assert.equal(policy.forbidden_permissions.administration, "write");
  assert.equal(policy.forbidden_permissions.contents, "write");
  assert.equal(policy.forbidden_permissions.secrets, "write");
  assert.equal(policy.forbidden_permissions.packages, "write");
});
