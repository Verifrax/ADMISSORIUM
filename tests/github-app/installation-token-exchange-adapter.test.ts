import assert from "node:assert/strict";
import test from "node:test";
import { buildInstallationTokenPlan } from "../../app/installation-token-plan.js";
import { guardedInstallationTokenExchange, type InstallationTokenExchangeClient } from "../../app/installation-token-exchange-adapter.js";

function readyPlan() {
  const plan = buildInstallationTokenPlan({
    mode: "guarded-exchange",
    repositoryFullName: "Verifrax/ADMISSORIUM",
    appId: "env:ADMISSORIUM_APP_ID",
    installationId: "env:ADMISSORIUM_INSTALLATION_ID",
    privateKeyRef: "secret:ADMISSORIUM_PRIVATE_KEY"
  });
  return { ...plan, dry_run: false as const };
}

function client(result = { tokenRef: "runtime:installation-token:admissorium", expiresAt: "2026-04-25T21:00:00Z" }) {
  let calls = 0;
  const c: InstallationTokenExchangeClient = {
    async exchange() {
      calls += 1;
      return {
        ...result,
        permissions: readyPlan().requested_permissions,
        repositories: ["Verifrax/ADMISSORIUM"]
      };
    }
  };
  return { c, calls: () => calls };
}

test("guarded exchange skips dry-run plans", async () => {
  const { c, calls } = client();
  const plan = buildInstallationTokenPlan({
    mode: "guarded-exchange",
    repositoryFullName: "Verifrax/ADMISSORIUM",
    appId: "env:ADMISSORIUM_APP_ID",
    installationId: "env:ADMISSORIUM_INSTALLATION_ID",
    privateKeyRef: "secret:ADMISSORIUM_PRIVATE_KEY"
  });

  const result = await guardedInstallationTokenExchange({ plan, client: c, executeExchange: true });

  assert.equal(result.decision, "SKIPPED_DRY_RUN_PLAN");
  assert.equal(result.client_called, false);
  assert.equal(calls(), 0);
});

test("guarded exchange requires explicit execution", async () => {
  const { c, calls } = client();
  const result = await guardedInstallationTokenExchange({ plan: readyPlan(), client: c });

  assert.equal(result.decision, "DENIED_EXPLICIT_EXECUTION_REQUIRED");
  assert.equal(result.client_called, false);
  assert.equal(calls(), 0);
});

test("guarded exchange respects emergency stop", async () => {
  const { c, calls } = client();
  const result = await guardedInstallationTokenExchange({
    plan: readyPlan(),
    client: c,
    executeExchange: true,
    env: { ADMISSORIUM_TOKEN_EXCHANGE_DISABLED: "true" }
  });

  assert.equal(result.decision, "DENIED_EMERGENCY_STOP");
  assert.equal(result.client_called, false);
  assert.equal(calls(), 0);
});

test("guarded exchange denies unready plan", async () => {
  const { c, calls } = client();
  const plan = buildInstallationTokenPlan({
    mode: "guarded-exchange",
    repositoryFullName: "Verifrax/ADMISSORIUM",
    installationId: "env:ADMISSORIUM_INSTALLATION_ID",
    privateKeyRef: "secret:ADMISSORIUM_PRIVATE_KEY"
  });

  const result = await guardedInstallationTokenExchange({
    plan: { ...plan, dry_run: false as const },
    client: c,
    executeExchange: true
  });

  assert.equal(result.decision, "DENIED_PLAN_NOT_READY");
  assert.equal(result.client_called, false);
  assert.equal(calls(), 0);
});

test("guarded exchange rejects raw token material returned by client", async () => {
  const { c, calls } = client({ tokenRef: "ghs_raw_token_material", expiresAt: "2026-04-25T21:00:00Z" });
  const result = await guardedInstallationTokenExchange({
    plan: readyPlan(),
    client: c,
    executeExchange: true
  });

  assert.equal(result.decision, "DENIED_RAW_TOKEN_MATERIAL");
  assert.equal(result.client_called, true);
  assert.equal(result.token_ref, null);
  assert.equal(result.token_persisted, false);
  assert.equal(result.token_material_returned, false);
  assert.equal(calls(), 1);
});

test("guarded exchange returns only non-secret token reference when all guards pass", async () => {
  const { c, calls } = client();
  const result = await guardedInstallationTokenExchange({
    plan: readyPlan(),
    client: c,
    executeExchange: true
  });

  assert.equal(result.decision, "EXCHANGED_TOKEN_REFERENCE");
  assert.equal(result.client_called, true);
  assert.equal(result.token_ref, "runtime:installation-token:admissorium");
  assert.equal(result.expires_at, "2026-04-25T21:00:00Z");
  assert.equal(result.token_persisted, false);
  assert.equal(result.token_material_returned, false);
  assert.equal(result.write_behavior, "NONE");
  assert.equal(calls(), 1);
});
