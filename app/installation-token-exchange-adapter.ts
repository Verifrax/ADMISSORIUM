import type { InstallationTokenPlan } from "./installation-token-plan.js";

export type ExecutableInstallationTokenPlan = Omit<InstallationTokenPlan, "dry_run"> & {
  dry_run: false;
};

export type GuardableInstallationTokenPlan = InstallationTokenPlan | ExecutableInstallationTokenPlan;

export interface InstallationTokenExchangeClientInput {
  appIdRef: string;
  installationIdRef: string;
  privateKeyRef: string;
  repositories: string[];
  permissions: InstallationTokenPlan["requested_permissions"];
  ttlSeconds: number;
}

export interface InstallationTokenExchangeClientResult {
  tokenRef: string;
  expiresAt: string;
  permissions: InstallationTokenPlan["requested_permissions"];
  repositories: string[];
}

export interface InstallationTokenExchangeClient {
  exchange(input: InstallationTokenExchangeClientInput): Promise<InstallationTokenExchangeClientResult>;
}

export interface GuardedInstallationTokenExchangeInput {
  plan: GuardableInstallationTokenPlan;
  client: InstallationTokenExchangeClient;
  executeExchange?: boolean;
  env?: NodeJS.ProcessEnv;
}

export type GuardedInstallationTokenExchangeDecision =
  | "SKIPPED_DRY_RUN_PLAN"
  | "DENIED_EXPLICIT_EXECUTION_REQUIRED"
  | "DENIED_EMERGENCY_STOP"
  | "DENIED_PLAN_NOT_READY"
  | "DENIED_RAW_TOKEN_MATERIAL"
  | "EXCHANGED_TOKEN_REFERENCE";

export interface GuardedInstallationTokenExchangeResult {
  decision: GuardedInstallationTokenExchangeDecision;
  client_called: boolean;
  token_persisted: false;
  token_material_returned: false;
  write_behavior: "NONE";
  token_ref: string | null;
  expires_at: string | null;
  reasons: string[];
}

function enabled(value: string | undefined): boolean {
  return value === "true" || value === "1" || value === "yes";
}

function containsRawTokenMaterial(value: string): boolean {
  return value.startsWith("ghs_") || value.startsWith("ghu_") || value.startsWith("github_pat_") || value.length > 96;
}

export async function guardedInstallationTokenExchange(
  input: GuardedInstallationTokenExchangeInput
): Promise<GuardedInstallationTokenExchangeResult> {
  const env = input.env ?? process.env;

  if (input.plan.dry_run || input.plan.token_exchange !== "NOT_PERFORMED") {
    return {
      decision: "SKIPPED_DRY_RUN_PLAN",
      client_called: false,
      token_persisted: false,
      token_material_returned: false,
      write_behavior: "NONE",
      token_ref: null,
      expires_at: null,
      reasons: ["Plan is dry-run or already represents token exchange state."]
    };
  }

  if (input.executeExchange !== true) {
    return {
      decision: "DENIED_EXPLICIT_EXECUTION_REQUIRED",
      client_called: false,
      token_persisted: false,
      token_material_returned: false,
      write_behavior: "NONE",
      token_ref: null,
      expires_at: null,
      reasons: ["Explicit executeExchange=true is required."]
    };
  }

  if (enabled(env.ADMISSORIUM_WRITE_DISABLED) || enabled(env.ADMISSORIUM_TOKEN_EXCHANGE_DISABLED)) {
    return {
      decision: "DENIED_EMERGENCY_STOP",
      client_called: false,
      token_persisted: false,
      token_material_returned: false,
      write_behavior: "NONE",
      token_ref: null,
      expires_at: null,
      reasons: ["Emergency stop prevents installation token exchange."]
    };
  }

  if (
    input.plan.decision !== "READY_FOR_GUARDED_EXCHANGE" ||
    input.plan.allowed_to_exchange !== true ||
    input.plan.app_id_ref === null ||
    input.plan.installation_id_ref === null ||
    input.plan.private_key_ref === null
  ) {
    return {
      decision: "DENIED_PLAN_NOT_READY",
      client_called: false,
      token_persisted: false,
      token_material_returned: false,
      write_behavior: "NONE",
      token_ref: null,
      expires_at: null,
      reasons: ["Installation token plan is not ready for guarded exchange."]
    };
  }

  const exchanged = await input.client.exchange({
    appIdRef: input.plan.app_id_ref,
    installationIdRef: input.plan.installation_id_ref,
    privateKeyRef: input.plan.private_key_ref,
    repositories: input.plan.requested_repositories,
    permissions: input.plan.requested_permissions,
    ttlSeconds: input.plan.ttl_seconds
  });

  if (containsRawTokenMaterial(exchanged.tokenRef)) {
    return {
      decision: "DENIED_RAW_TOKEN_MATERIAL",
      client_called: true,
      token_persisted: false,
      token_material_returned: false,
      write_behavior: "NONE",
      token_ref: null,
      expires_at: null,
      reasons: ["Client returned raw token-like material instead of a non-secret token reference."]
    };
  }

  return {
    decision: "EXCHANGED_TOKEN_REFERENCE",
    client_called: true,
    token_persisted: false,
    token_material_returned: false,
    write_behavior: "NONE",
    token_ref: exchanged.tokenRef,
    expires_at: exchanged.expiresAt,
    reasons: ["Client returned a non-secret token reference; adapter did not persist token material."]
  };
}
