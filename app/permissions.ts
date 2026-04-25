import fs from "node:fs";
import path from "node:path";

export type PermissionLevel = "none" | "read" | "write" | "admin";
export type PermissionDecision =
  | "ALLOW"
  | "DENY"
  | "DENY_WRITE_DISABLED"
  | "DENY_FORBIDDEN_PERMISSION"
  | "DENY_PROTECTED_PATH"
  | "REQUIRES_GOVERNANCE_REVIEW";

export type ProtectedPathDecision =
  | "ALLOW_PROJECTION_REPAIR"
  | "DENY_AUTOMATIC_MUTATION"
  | "REQUIRES_GOVERNANCE_REVIEW";

export type ActuatorMode =
  | "audit"
  | "block"
  | "repair-projection"
  | "candidate-registry"
  | "quarantine"
  | "emergency-stop";

export type WriteClass =
  | "CHECK_RUN"
  | "PROJECTION_REPAIR_BRANCH"
  | "PROJECTION_REPAIR_PULL_REQUEST"
  | "REGISTRY_CANDIDATE_PULL_REQUEST"
  | "QUARANTINE_ISSUE"
  | "QUARANTINE_MARKER_PULL_REQUEST"
  | "TRUTH_MUTATION";

export interface PermissionPolicy {
  schema: string;
  version: string;
  status: string;
  environment: {
    write_disabled_variable: string;
    write_disabled_true_values: string[];
  };
  github_app_permissions: {
    required_first_app: Record<string, PermissionLevel>;
    forbidden_first_app: Record<string, PermissionLevel>;
  };
  modes: Record<string, { writes_allowed: boolean; allowed_write_classes?: string[] }>;
  write_classes: Record<string, {
    allowed: boolean;
    requires_write_disabled_false?: boolean;
    may_touch_repository_contents: boolean;
    protected_path_behavior?: "deny" | "governance_review";
  }>;
}

export interface ProtectedPathClass {
  id: string;
  decision: ProtectedPathDecision;
  patterns: string[];
  reason: string;
}

export interface ProtectedPathsPolicy {
  schema: string;
  version: string;
  status: string;
  default_decision: ProtectedPathDecision;
  protected_decision: ProtectedPathDecision;
  governance_review_decision: ProtectedPathDecision;
  classes: ProtectedPathClass[];
}

export interface WriteDecisionInput {
  mode: ActuatorMode;
  writeClass: WriteClass;
  targetPath?: string;
  env?: NodeJS.ProcessEnv;
  permissionPolicy?: PermissionPolicy;
  protectedPathsPolicy?: ProtectedPathsPolicy;
}

export interface WriteDecision {
  decision: PermissionDecision;
  reason: string;
  matchedProtectedClass?: string;
}

const DEFAULT_POLICY_ROOT = process.cwd();

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function loadPermissionPolicy(root = DEFAULT_POLICY_ROOT): PermissionPolicy {
  return readJsonFile<PermissionPolicy>(path.join(root, "policies", "permission-policy.json"));
}

export function loadProtectedPathsPolicy(root = DEFAULT_POLICY_ROOT): ProtectedPathsPolicy {
  return readJsonFile<ProtectedPathsPolicy>(path.join(root, "policies", "protected-paths.json"));
}

export function isWriteDisabled(policy: PermissionPolicy, env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env[policy.environment.write_disabled_variable];
  return typeof raw === "string" && policy.environment.write_disabled_true_values.includes(raw);
}

export function normalizeRepoPath(input: string): string {
  return input.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+/g, "/");
}

function escapeRegex(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

export function globPatternToRegExp(pattern: string): RegExp {
  const normalized = normalizeRepoPath(pattern);
  const segments = normalized.split("/");
  const source = segments.map((segment) => {
    if (segment === "**") return "(?:.*)";
    const escaped = escapeRegex(segment).replace(/\\\*/g, "[^/]*");
    return escaped;
  }).join("/");
  return new RegExp(`^${source}$`);
}

export function protectedPathClassFor(targetPath: string, policy: ProtectedPathsPolicy): ProtectedPathClass | undefined {
  const normalized = normalizeRepoPath(targetPath);
  for (const entry of policy.classes) {
    for (const pattern of entry.patterns) {
      if (globPatternToRegExp(pattern).test(normalized)) return entry;
    }
  }
  return undefined;
}

export function protectedPathDecision(targetPath: string, policy: ProtectedPathsPolicy): {
  decision: ProtectedPathDecision;
  matchedClass?: ProtectedPathClass;
} {
  const matchedClass = protectedPathClassFor(targetPath, policy);
  if (!matchedClass) return { decision: policy.default_decision };
  return { decision: matchedClass.decision, matchedClass };
}

export function forbiddenPermissionRequests(
  requested: Record<string, PermissionLevel>,
  policy: PermissionPolicy
): string[] {
  const forbidden: string[] = [];
  for (const [permission, requestedLevel] of Object.entries(requested)) {
    const forbiddenLevel = policy.github_app_permissions.forbidden_first_app[permission];
    if (!forbiddenLevel) continue;
    if (requestedLevel === forbiddenLevel || requestedLevel === "admin") forbidden.push(permission);
  }
  return forbidden.sort();
}

export function decideWrite(input: WriteDecisionInput): WriteDecision {
  const permissionPolicy = input.permissionPolicy ?? loadPermissionPolicy();
  const protectedPathsPolicy = input.protectedPathsPolicy ?? loadProtectedPathsPolicy();

  if (isWriteDisabled(permissionPolicy, input.env)) {
    return {
      decision: "DENY_WRITE_DISABLED",
      reason: `${permissionPolicy.environment.write_disabled_variable} disables actuator writes.`
    };
  }

  const mode = permissionPolicy.modes[input.mode];
  if (!mode) {
    return { decision: "DENY", reason: `Unknown actuator mode: ${input.mode}` };
  }

  if (!mode.writes_allowed) {
    return { decision: "DENY", reason: `Mode ${input.mode} is read-only.` };
  }

  const writeClass = permissionPolicy.write_classes[input.writeClass];
  if (!writeClass || !writeClass.allowed) {
    return { decision: "DENY", reason: `Write class ${input.writeClass} is not allowed.` };
  }

  if (mode.allowed_write_classes && !mode.allowed_write_classes.includes(input.writeClass)) {
    return {
      decision: "DENY",
      reason: `Write class ${input.writeClass} is not allowed in mode ${input.mode}.`
    };
  }

  if (input.targetPath) {
    const pathDecision = protectedPathDecision(input.targetPath, protectedPathsPolicy);
    if (pathDecision.decision === "DENY_AUTOMATIC_MUTATION") {
      const matchedProtectedClass = pathDecision.matchedClass?.id;
      return {
        decision: "DENY_PROTECTED_PATH",
        reason: `Protected path blocks automatic mutation: ${input.targetPath}`,
        ...(matchedProtectedClass ? { matchedProtectedClass } : {})
      };
    }
    if (pathDecision.decision === "REQUIRES_GOVERNANCE_REVIEW") {
      const matchedProtectedClass = pathDecision.matchedClass?.id;
      return {
        decision: "REQUIRES_GOVERNANCE_REVIEW",
        reason: `Path requires governance review: ${input.targetPath}`,
        ...(matchedProtectedClass ? { matchedProtectedClass } : {})
      };
    }
  }

  return { decision: "ALLOW", reason: "Actuator write is allowed by current boundary policy." };
}
