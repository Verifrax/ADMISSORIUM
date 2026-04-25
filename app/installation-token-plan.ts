export type InstallationTokenPlanMode = "audit" | "dry-run" | "guarded-exchange";

export type InstallationTokenPlanDecision =
  | "NO_TOKEN_EXCHANGE"
  | "DENY_EMERGENCY_STOP"
  | "DENY_MISSING_APP_ID"
  | "DENY_MISSING_INSTALLATION_ID"
  | "DENY_MISSING_PRIVATE_KEY_REF"
  | "DENY_RAW_PRIVATE_KEY_MATERIAL"
  | "READY_FOR_GUARDED_EXCHANGE";

export interface InstallationTokenPermissions {
  metadata: "read";
  contents: "read";
  pull_requests: "read" | "write";
  issues: "read" | "write";
  checks: "read" | "write";
  actions: "read";
  statuses: "read" | "write";
}

export interface InstallationTokenPlanInput {
  mode?: InstallationTokenPlanMode;
  repositoryFullName: string;
  appId?: string;
  installationId?: string;
  privateKeyRef?: string;
  requestedRepositories?: string[];
  requestedPermissions?: Partial<InstallationTokenPermissions>;
  ttlSeconds?: number;
  env?: NodeJS.ProcessEnv;
}

export interface InstallationTokenPlan {
  mode: InstallationTokenPlanMode;
  repository: string;
  dry_run: true;
  write_behavior: "NONE";
  token_exchange: "NOT_PERFORMED";
  allowed_to_exchange: boolean;
  decision: InstallationTokenPlanDecision;
  reasons: string[];
  app_id_ref: string | null;
  installation_id_ref: string | null;
  private_key_ref: string | null;
  requested_repositories: string[];
  requested_permissions: InstallationTokenPermissions;
  ttl_seconds: number;
  required_guards: string[];
  forbidden_materialization: string[];
}

const DEFAULT_PERMISSIONS: InstallationTokenPermissions = {
  metadata: "read",
  contents: "read",
  pull_requests: "write",
  issues: "write",
  checks: "write",
  actions: "read",
  statuses: "write"
};

const REQUIRED_GUARDS = [
  "ADMISSORIUM_WRITE_DISABLED must not be true",
  "ADMISSORIUM_TOKEN_EXCHANGE_DISABLED must not be true",
  "mode must be guarded-exchange",
  "app id must be supplied by reference",
  "installation id must be supplied by reference",
  "private key must be supplied by reference",
  "raw private key material must never be passed into this planner",
  "caller must provide the actual GitHub client outside this planner"
];

const FORBIDDEN_MATERIALIZATION = [
  "private key bytes",
  "JWT signing",
  "installation token exchange",
  "installation token persistence",
  "GitHub API client construction",
  "repository contents mutation",
  "branch creation",
  "pull request creation",
  "issue creation",
  "check-run creation"
];

function isEnabled(value: string | undefined): boolean {
  return value === "true" || value === "1" || value === "yes";
}

function cleanRef(value: string | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function containsRawPrivateKeyMaterial(value: string | null): boolean {
  if (value === null) return false;
  return (
    value.includes("-----BEGIN") ||
    value.includes("PRIVATE KEY-----") ||
    value.includes("\n") ||
    value.includes("\r")
  );
}

function ttl(input: number | undefined): number {
  if (typeof input !== "number" || !Number.isFinite(input)) return 3600;
  if (input < 60) return 60;
  if (input > 3600) return 3600;
  return Math.trunc(input);
}

function permissions(input: Partial<InstallationTokenPermissions> | undefined): InstallationTokenPermissions {
  return {
    ...DEFAULT_PERMISSIONS,
    ...(input ?? {}),
    metadata: "read",
    actions: "read",
    contents: input?.contents ?? DEFAULT_PERMISSIONS.contents
  };
}

export function buildInstallationTokenPlan(input: InstallationTokenPlanInput): InstallationTokenPlan {
  const env = input.env ?? process.env;
  const mode = input.mode ?? "dry-run";
  const appIdRef = cleanRef(input.appId);
  const installationIdRef = cleanRef(input.installationId);
  const privateKeyRef = cleanRef(input.privateKeyRef);
  const reasons: string[] = [];

  let decision: InstallationTokenPlanDecision = "NO_TOKEN_EXCHANGE";
  let allowedToExchange = false;

  if (isEnabled(env.ADMISSORIUM_WRITE_DISABLED) || isEnabled(env.ADMISSORIUM_TOKEN_EXCHANGE_DISABLED)) {
    decision = "DENY_EMERGENCY_STOP";
    reasons.push("Emergency stop prevents installation token exchange.");
  } else if (containsRawPrivateKeyMaterial(privateKeyRef)) {
    decision = "DENY_RAW_PRIVATE_KEY_MATERIAL";
    reasons.push("Private key material was provided directly instead of by reference.");
  } else if (mode !== "guarded-exchange") {
    decision = "NO_TOKEN_EXCHANGE";
    reasons.push("Planner is not in guarded-exchange mode; no token exchange may occur.");
  } else if (appIdRef === null) {
    decision = "DENY_MISSING_APP_ID";
    reasons.push("GitHub App id reference is required before guarded exchange.");
  } else if (installationIdRef === null) {
    decision = "DENY_MISSING_INSTALLATION_ID";
    reasons.push("GitHub App installation id reference is required before guarded exchange.");
  } else if (privateKeyRef === null) {
    decision = "DENY_MISSING_PRIVATE_KEY_REF";
    reasons.push("GitHub App private key reference is required before guarded exchange.");
  } else {
    decision = "READY_FOR_GUARDED_EXCHANGE";
    allowedToExchange = true;
    reasons.push("All request preconditions are present, but this planner still performs no token exchange.");
  }

  return {
    mode,
    repository: input.repositoryFullName,
    dry_run: true,
    write_behavior: "NONE",
    token_exchange: "NOT_PERFORMED",
    allowed_to_exchange: allowedToExchange,
    decision,
    reasons,
    app_id_ref: appIdRef,
    installation_id_ref: installationIdRef,
    private_key_ref: privateKeyRef,
    requested_repositories:
      input.requestedRepositories && input.requestedRepositories.length > 0
        ? [...input.requestedRepositories]
        : [input.repositoryFullName],
    requested_permissions: permissions(input.requestedPermissions),
    ttl_seconds: ttl(input.ttlSeconds),
    required_guards: [...REQUIRED_GUARDS],
    forbidden_materialization: [...FORBIDDEN_MATERIALIZATION]
  };
}
