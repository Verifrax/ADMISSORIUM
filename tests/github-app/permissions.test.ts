import test from "node:test";
import assert from "node:assert/strict";
import {
  decideWrite,
  forbiddenPermissionRequests,
  loadPermissionPolicy,
  loadProtectedPathsPolicy,
  protectedPathDecision
} from "../../app/permissions.js";

test("emergency stop disables write classes", () => {
  const permissionPolicy = loadPermissionPolicy();
  const protectedPathsPolicy = loadProtectedPathsPolicy();

  const decision = decideWrite({
    mode: "repair-projection",
    writeClass: "PROJECTION_REPAIR_BRANCH",
    targetPath: "README.md",
    env: { ADMISSORIUM_WRITE_DISABLED: "true" },
    permissionPolicy,
    protectedPathsPolicy
  });

  assert.equal(decision.decision, "DENY_WRITE_DISABLED");
});

test("audit mode remains read only", () => {
  const decision = decideWrite({
    mode: "audit",
    writeClass: "CHECK_RUN",
    env: {},
    permissionPolicy: loadPermissionPolicy(),
    protectedPathsPolicy: loadProtectedPathsPolicy()
  });

  assert.equal(decision.decision, "DENY");
});

test("block mode allows check-run write only", () => {
  const permissionPolicy = loadPermissionPolicy();
  const protectedPathsPolicy = loadProtectedPathsPolicy();

  assert.equal(decideWrite({
    mode: "block",
    writeClass: "CHECK_RUN",
    env: {},
    permissionPolicy,
    protectedPathsPolicy
  }).decision, "ALLOW");

  assert.equal(decideWrite({
    mode: "block",
    writeClass: "PROJECTION_REPAIR_BRANCH",
    targetPath: "README.md",
    env: {},
    permissionPolicy,
    protectedPathsPolicy
  }).decision, "DENY");
});

test("forbidden first app permissions are detected", () => {
  const policy = loadPermissionPolicy();

  assert.deepEqual(
    forbiddenPermissionRequests({
      metadata: "read",
      contents: "write",
      administration: "write",
      packages: "write"
    }, policy),
    ["administration", "contents", "packages"]
  );
});

test("projection repair allows non-protected projection paths", () => {
  const decision = decideWrite({
    mode: "repair-projection",
    writeClass: "PROJECTION_REPAIR_BRANCH",
    targetPath: "docs/operator.md",
    env: {},
    permissionPolicy: loadPermissionPolicy(),
    protectedPathsPolicy: loadProtectedPathsPolicy()
  });

  assert.equal(decision.decision, "ALLOW");
});

test("projection repair blocks protected current truth paths", () => {
  const decision = decideWrite({
    mode: "repair-projection",
    writeClass: "PROJECTION_REPAIR_BRANCH",
    targetPath: "epochs/current/accepted-epoch.json",
    env: {},
    permissionPolicy: loadPermissionPolicy(),
    protectedPathsPolicy: loadProtectedPathsPolicy()
  });

  assert.equal(decision.decision, "DENY_PROTECTED_PATH");
  assert.equal(decision.matchedProtectedClass, "accepted-state");
});

test("registry candidate paths require governance review", () => {
  const decision = decideWrite({
    mode: "candidate-registry",
    writeClass: "REGISTRY_CANDIDATE_PULL_REQUEST",
    targetPath: ".github/GOVERNED_REPOS.txt",
    env: {},
    permissionPolicy: loadPermissionPolicy(),
    protectedPathsPolicy: loadProtectedPathsPolicy()
  });

  assert.equal(decision.decision, "REQUIRES_GOVERNANCE_REVIEW");
  assert.equal(decision.matchedProtectedClass, "governance-registries");
});

test("protected path classifier maps truth objects", () => {
  const policy = loadProtectedPathsPolicy();

  assert.equal(protectedPathDecision("authorities/current/root.json", policy).decision, "DENY_AUTOMATIC_MUTATION");
  assert.equal(protectedPathDecision("recognitions/current/r-1.json", policy).decision, "DENY_AUTOMATIC_MUTATION");
  assert.equal(protectedPathDecision("recourses/current/r-1.json", policy).decision, "DENY_AUTOMATIC_MUTATION");
  assert.equal(protectedPathDecision("reports/current/admissibility-report.json", policy).decision, "ALLOW_PROJECTION_REPAIR");
});
