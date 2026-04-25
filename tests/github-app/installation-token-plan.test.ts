import assert from "node:assert/strict";
import test from "node:test";
import { buildInstallationTokenPlan } from "../../app/installation-token-plan.js";

test("installation token planner never exchanges in dry-run mode", () => {
  const plan = buildInstallationTokenPlan({
    mode: "dry-run",
    repositoryFullName: "Verifrax/ADMISSORIUM",
    appId: "env:ADMISSORIUM_APP_ID",
    installationId: "env:ADMISSORIUM_INSTALLATION_ID",
    privateKeyRef: "secret:ADMISSORIUM_PRIVATE_KEY"
  });

  assert.equal(plan.decision, "NO_TOKEN_EXCHANGE");
  assert.equal(plan.allowed_to_exchange, false);
  assert.equal(plan.token_exchange, "NOT_PERFORMED");
  assert.equal(plan.write_behavior, "NONE");
  assert.equal(plan.dry_run, true);
});

test("installation token planner respects emergency stop", () => {
  const plan = buildInstallationTokenPlan({
    mode: "guarded-exchange",
    repositoryFullName: "Verifrax/ADMISSORIUM",
    appId: "env:ADMISSORIUM_APP_ID",
    installationId: "env:ADMISSORIUM_INSTALLATION_ID",
    privateKeyRef: "secret:ADMISSORIUM_PRIVATE_KEY",
    env: {
      ADMISSORIUM_TOKEN_EXCHANGE_DISABLED: "true"
    }
  });

  assert.equal(plan.decision, "DENY_EMERGENCY_STOP");
  assert.equal(plan.allowed_to_exchange, false);
});

test("installation token planner rejects raw private key material", () => {
  const plan = buildInstallationTokenPlan({
    mode: "guarded-exchange",
    repositoryFullName: "Verifrax/ADMISSORIUM",
    appId: "env:ADMISSORIUM_APP_ID",
    installationId: "env:ADMISSORIUM_INSTALLATION_ID",
    privateKeyRef: "-----BEGIN PRIVATE KEY-----\\nnot-a-real-key\\n-----END PRIVATE KEY-----"
  });

  assert.equal(plan.decision, "DENY_RAW_PRIVATE_KEY_MATERIAL");
  assert.equal(plan.allowed_to_exchange, false);
});

test("installation token planner requires app id installation id and key references", () => {
  assert.equal(
    buildInstallationTokenPlan({
      mode: "guarded-exchange",
      repositoryFullName: "Verifrax/ADMISSORIUM",
      installationId: "env:ADMISSORIUM_INSTALLATION_ID",
      privateKeyRef: "secret:ADMISSORIUM_PRIVATE_KEY"
    }).decision,
    "DENY_MISSING_APP_ID"
  );

  assert.equal(
    buildInstallationTokenPlan({
      mode: "guarded-exchange",
      repositoryFullName: "Verifrax/ADMISSORIUM",
      appId: "env:ADMISSORIUM_APP_ID",
      privateKeyRef: "secret:ADMISSORIUM_PRIVATE_KEY"
    }).decision,
    "DENY_MISSING_INSTALLATION_ID"
  );

  assert.equal(
    buildInstallationTokenPlan({
      mode: "guarded-exchange",
      repositoryFullName: "Verifrax/ADMISSORIUM",
      appId: "env:ADMISSORIUM_APP_ID",
      installationId: "env:ADMISSORIUM_INSTALLATION_ID"
    }).decision,
    "DENY_MISSING_PRIVATE_KEY_REF"
  );
});

test("installation token planner can become ready without performing exchange", () => {
  const plan = buildInstallationTokenPlan({
    mode: "guarded-exchange",
    repositoryFullName: "Verifrax/ADMISSORIUM",
    appId: "env:ADMISSORIUM_APP_ID",
    installationId: "env:ADMISSORIUM_INSTALLATION_ID",
    privateKeyRef: "secret:ADMISSORIUM_PRIVATE_KEY",
    requestedRepositories: ["Verifrax/ADMISSORIUM"],
    ttlSeconds: 7200
  });

  assert.equal(plan.decision, "READY_FOR_GUARDED_EXCHANGE");
  assert.equal(plan.allowed_to_exchange, true);
  assert.equal(plan.token_exchange, "NOT_PERFORMED");
  assert.equal(plan.ttl_seconds, 3600);
  assert.deepEqual(plan.requested_repositories, ["Verifrax/ADMISSORIUM"]);
  assert.equal(plan.requested_permissions.metadata, "read");
  assert.equal(plan.requested_permissions.checks, "write");
});
