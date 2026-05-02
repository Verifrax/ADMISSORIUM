import fs from "node:fs";

export type PermissionPolicy = {
  environment?: { write_disabled_variable?: string };
  emergency_stop?: { write_disabled_variable?: string };
  forbidden_first_app?: string[];
  modes?: Record<string, Record<string, boolean>>;
};

export type ProtectedPathClass = {
  id: string;
  class: string;
  paths: string[];
};

export type ProtectedPathsPolicy = {
  policy_type?: string;
  schema_version?: string;
  protected_classes?: ProtectedPathClass[];
  protectedClasses?: ProtectedPathClass[];
  if_touched?: {
    automatic_projection_repair_allowed?: boolean;
    direct_write_allowed?: boolean;
    required_decision?: string;
  };
};

export type WriteDecision = {
  decision: string;
  reason?: string;

  allowed?: boolean;
  writeAllowed?: boolean;
  write_allowed?: boolean;
  denied?: boolean;

  emergencyStopActive?: boolean;
  emergency_stop_active?: boolean;
  writeDisabled?: boolean;
  write_disabled?: boolean;

  dryRun?: boolean;
  dry_run?: boolean;

  requiresGovernanceReview?: boolean;
  requires_governance_review?: boolean;

  protectedPathTouched?: boolean;
  protected_path_touched?: boolean;
  matchedProtectedClass?: string | null;
  matched_protected_class?: string | null;

  checkRunWriteAllowed?: boolean;
  check_run_write_allowed?: boolean;
  projectionRepairAllowed?: boolean;
  projection_repair_allowed?: boolean;
  quarantineIssueAllowed?: boolean;
  quarantine_issue_allowed?: boolean;
};

export type DecideWriteInput = {
  mode?: string;
  writeClass?: string;
  write_class?: string;
  action?: string;
  targetPath?: string;
  target_path?: string;
  changedPaths?: string[];
  changed_paths?: string[];
  executeWrite?: boolean;
  execute_write?: boolean;
  permissionPolicy?: PermissionPolicy;
  permission_policy?: PermissionPolicy;
  protectedPathsPolicy?: ProtectedPathsPolicy;
  protected_paths_policy?: ProtectedPathsPolicy;
  policy?: PermissionPolicy;
  env?: NodeJS.ProcessEnv;
};

const DEFAULT_PERMISSION_POLICY = {
  environment: {
    write_disabled_variable: "ADMISSORIUM_WRITE_DISABLED"
  },
  forbidden_first_app: [
    "administration:write",
    "contents:write",
    "secrets:write",
    "variables:write",
    "environments:write",
    "deployments:write",
    "packages:write",
    "members:write"
  ],
  modes: {
    audit: {
      may_emit_reports: true,
      may_emit_check_runs: false,
      may_open_projection_repair_pr: false,
      may_open_quarantine_issue: false,
      may_write_repository_contents: false
    },
    block: {
      may_emit_reports: true,
      may_emit_check_runs: true,
      may_open_projection_repair_pr: false,
      may_open_quarantine_issue: false,
      may_write_repository_contents: false
    },
    projection_repair: {
      may_emit_reports: true,
      may_emit_check_runs: true,
      may_open_projection_repair_pr: true,
      may_open_quarantine_issue: false,
      may_write_repository_contents: false
    },
    quarantine: {
      may_emit_reports: true,
      may_emit_check_runs: true,
      may_open_projection_repair_pr: false,
      may_open_quarantine_issue: true,
      may_write_repository_contents: false
    }
  }
};

const DEFAULT_PROTECTED_CLASSES: ProtectedPathClass[] = [
  { id: "constitutional-law", class: "constitutional-law", paths: ["law/**", "laws/**"] },
  { id: "freeze", class: "freeze", paths: ["freeze/**", "freezes/**"] },
  { id: "accepted-state", class: "accepted-state", paths: ["current/**", "epochs/current/**", "state/current/**"] },
  { id: "authority", class: "authority", paths: ["authorities/current/**"] },
  { id: "execution-receipts", class: "execution-receipts", paths: ["receipts/current/**"] },
  { id: "verification", class: "verification", paths: ["verification/results/current/**"] },
  { id: "recognition", class: "recognition", paths: ["recognitions/current/**"] },
  { id: "recourse", class: "recourse", paths: ["recourse/current/**", "recourses/current/**"] },
  { id: "claims", class: "claims", paths: ["claims/current/**"] },
  { id: "continuity", class: "continuity", paths: ["continuity/current/**", "transfer/current/**"] },
  { id: "release-identity", class: "release-identity", paths: ["LICENSE", "package.json", ".github/workflows/*release*"] },
  {
    id: "governance-registries",
    class: "governance-registries",
    paths: [
      ".github/GOVERNED_REPOS.txt",
      ".github/LICENSES.json",
      ".github/PACKAGES.json",
      ".github/REPO_CLASSES.json"
    ]
  }
];

const DEFAULT_PROTECTED_PATHS_POLICY = {
  policy_type: "ADMISSORIUM_PROTECTED_TRUTH_PATHS",
  schema_version: "1.0.0",
  protected_classes: DEFAULT_PROTECTED_CLASSES,
  protectedClasses: DEFAULT_PROTECTED_CLASSES,
  if_touched: {
    automatic_projection_repair_allowed: false,
    direct_write_allowed: false,
    required_decision: "GOVERNANCE_REVIEW_REQUIRED_OR_BLOCKED"
  }
};

function readJson<T>(path: string): T {
  return JSON.parse(fs.readFileSync(path, "utf8")) as T;
}

function withPermissionDefaults(policy: PermissionPolicy = {}) {
  const environment = {
    ...DEFAULT_PERMISSION_POLICY.environment,
    ...(policy.environment || {}),
    ...(policy.emergency_stop || {})
  };

  return {
    environment,
    emergency_stop: environment,
    forbidden_first_app: policy.forbidden_first_app || [...DEFAULT_PERMISSION_POLICY.forbidden_first_app],
    modes: {
      ...DEFAULT_PERMISSION_POLICY.modes,
      ...(policy.modes || {})
    }
  };
}

function normalizeProtectedClass(entry: any): ProtectedPathClass {
  const rawId = entry.id || entry.class;
  const idMap: Record<string, string> = {
    "verification": "verification-results",
    "recognition": "terminal-recognition",
    "recourse": "terminal-recourse",
    "continuity": "continuity-transfer"
  };
  const id = idMap[rawId] || rawId;
  return {
    id,
    class: entry.class || id,
    paths: entry.paths || entry.path_patterns || entry.patterns || entry.globs || []
  };
}

function withProtectedPathDefaults(policy: ProtectedPathsPolicy = {}) {
  const legacyClasses = (policy as any).classes;
  const classes = (policy.protected_classes || policy.protectedClasses || legacyClasses || DEFAULT_PROTECTED_CLASSES)
    .map(normalizeProtectedClass);

  return {
    policy_type: policy.policy_type || DEFAULT_PROTECTED_PATHS_POLICY.policy_type,
    schema_version: policy.schema_version || DEFAULT_PROTECTED_PATHS_POLICY.schema_version,
    protected_classes: classes,
    protectedClasses: classes,
    if_touched: {
      ...DEFAULT_PROTECTED_PATHS_POLICY.if_touched,
      ...(policy.if_touched || {})
    }
  };
}

export function loadPermissionPolicy(path = "policies/permission-policy.json") {
  if (!fs.existsSync(path)) return withPermissionDefaults();
  return withPermissionDefaults(readJson<PermissionPolicy>(path));
}

export function loadProtectedPathsPolicy(path = "policies/protected-paths.json") {
  if (!fs.existsSync(path)) return withProtectedPathDefaults();
  return withProtectedPathDefaults(readJson<ProtectedPathsPolicy>(path));
}

function globToRegExp(glob: string): RegExp {
  const token = "__DOUBLE_STAR__";
  const escaped = glob
    .replace(/\*\*/g, token)
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, "[^/]*")
    .replaceAll(token, ".*");
  return new RegExp(`^${escaped}$`);
}

export function protectedPathClassFor(
  candidatePath: string,
  policy: ProtectedPathsPolicy = loadProtectedPathsPolicy()
): ProtectedPathClass | undefined {
  const normalized = withProtectedPathDefaults(policy);
  for (const entry of normalized.protected_classes) {
    if (entry.paths.some((glob: string) => globToRegExp(glob).test(candidatePath))) {
      return entry;
    }
  }
  return undefined;
}

export function protectedPathDecision(
  changedPaths: string | string[] = [],
  policy: ProtectedPathsPolicy = loadProtectedPathsPolicy()
) {
  const paths = Array.isArray(changedPaths) ? changedPaths : [changedPaths];

  for (const changedPath of paths) {
    const matched = protectedPathClassFor(changedPath, policy);
    if (matched) {
      const isGovernance = matched.id === "governance-registries";
      return {
        protectedPathTouched: true,
        protected_path_touched: true,
        matchedProtectedClass: matched.id,
        matched_protected_class: matched.id,
        decision: isGovernance ? "REQUIRES_GOVERNANCE_REVIEW" : "DENY_AUTOMATIC_MUTATION"
      };
    }
  }

  return {
    protectedPathTouched: false,
    protected_path_touched: false,
    matchedProtectedClass: null,
    matched_protected_class: null,
    decision: "ALLOW_PROJECTION_REPAIR"
  };
}

export function isWriteDisabled(
  policy: PermissionPolicy = loadPermissionPolicy(),
  env: NodeJS.ProcessEnv = process.env
): boolean {
  const normalized = withPermissionDefaults(policy);
  const variable = normalized.environment.write_disabled_variable || "ADMISSORIUM_WRITE_DISABLED";
  return env[variable] === "true";
}

export function forbiddenPermissionRequests(
  requested: Record<string, string> = {},
  policy: PermissionPolicy = loadPermissionPolicy()
): string[] {
  const normalized = withPermissionDefaults(policy);
  const forbidden = new Set(normalized.forbidden_first_app);
  const denied = Object.entries(requested)
    .filter(([permission, level]) => forbidden.has(`${permission}:${level}`) || forbidden.has(permission))
    .map(([permission]) => permission);

  const order = normalized.forbidden_first_app.map((entry) => entry.split(":")[0]);
  return denied.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

export function decideWrite(input: DecideWriteInput = {}): WriteDecision {
  const permissionPolicy = withPermissionDefaults(
    input.permissionPolicy ||
    input.permission_policy ||
    input.policy ||
    loadPermissionPolicy()
  );

  const protectedPolicy = withProtectedPathDefaults(
    input.protectedPathsPolicy ||
    input.protected_paths_policy ||
    loadProtectedPathsPolicy()
  );

  const env = input.env || process.env;
  const rawMode = (input.mode || "audit").replace(/-/g, "_");
  const mode = rawMode === "repair_projection" ? "projection_repair" : rawMode;
  const writeClass = input.writeClass || input.write_class || input.action || "REPORT";
  const targetPath = input.targetPath || input.target_path;
  const changedPaths = input.changedPaths || input.changed_paths || (targetPath ? [targetPath] : []);
  const executeWrite = input.executeWrite === true || input.execute_write === true;

  const normalizedWriteClass = writeClass.toUpperCase();
  const emergency = isWriteDisabled(permissionPolicy, env);
  const pathDecision = protectedPathDecision(changedPaths, protectedPolicy);
  const requiresGovernanceReview = pathDecision.protectedPathTouched === true;

  const modes: Record<string, Record<string, boolean>> = permissionPolicy.modes as Record<string, Record<string, boolean>>;
  const modePolicy = modes[mode] || modes.audit || {};

  const checkRunWriteAllowed =
    modePolicy.may_emit_check_runs === true &&
    normalizedWriteClass === "CHECK_RUN";

  const isProjectionRepairWrite =
    normalizedWriteClass === "PROJECTION_REPAIR_BRANCH" ||
    normalizedWriteClass === "PROJECTION_REPAIR_PR" ||
    normalizedWriteClass === "PROJECTION_REPAIR" ||
    normalizedWriteClass.includes("PROJECTION_REPAIR");

  const projectionRepairAllowed =
    isProjectionRepairWrite &&
    !requiresGovernanceReview &&
    (modePolicy.may_open_projection_repair_pr === true || mode === "audit" || mode === "projection_repair");

  const quarantineIssueAllowed =
    modePolicy.may_open_quarantine_issue === true &&
    normalizedWriteClass === "QUARANTINE_ISSUE";

  let allowedByClass =
    ["REPORT", "LOCAL_REPORT", "LOCAL_VERDICT", "AUDIT"].includes(normalizedWriteClass) ||
    checkRunWriteAllowed ||
    projectionRepairAllowed ||
    quarantineIssueAllowed;

  if (mode === "audit" && !["REPORT", "LOCAL_REPORT", "LOCAL_VERDICT", "AUDIT"].includes(normalizedWriteClass)) {
    allowedByClass = false;
  }

  if (requiresGovernanceReview && !["CHECK_RUN", "REPORT", "LOCAL_REPORT", "LOCAL_VERDICT", "AUDIT"].includes(normalizedWriteClass)) {
    allowedByClass = false;
  }

  if (emergency) {
    const variable = permissionPolicy.environment.write_disabled_variable || "ADMISSORIUM_WRITE_DISABLED";
    return {
      allowed: false,
      writeAllowed: false,
      write_allowed: false,
      denied: true,
      reason: `${variable} disables actuator writes.`,
      decision: "DENY_WRITE_DISABLED",
      emergencyStopActive: true,
      emergency_stop_active: true,
      writeDisabled: true,
      write_disabled: true,
      dryRun: true,
      dry_run: true,
      requiresGovernanceReview,
      requires_governance_review: requiresGovernanceReview,
      protectedPathTouched: pathDecision.protectedPathTouched,
      protected_path_touched: pathDecision.protected_path_touched,
      matchedProtectedClass: pathDecision.matchedProtectedClass,
      matched_protected_class: pathDecision.matched_protected_class,
      checkRunWriteAllowed: false,
      check_run_write_allowed: false,
      projectionRepairAllowed: false,
      projection_repair_allowed: false,
      quarantineIssueAllowed: false,
      quarantine_issue_allowed: false
    };
  }

  const remoteWriteClasses = new Set([
    "CHECK_RUN",
    "PROJECTION_REPAIR_BRANCH",
    "QUARANTINE_ISSUE",
    "PR_COMMENT",
    "ISSUE",
    "LABEL",
    "BRANCH",
    "CONTENTS"
  ]);

  const writeAllowed = allowedByClass && (!remoteWriteClasses.has(normalizedWriteClass) || executeWrite);

  const decision = allowedByClass
    ? "ALLOW"
    : requiresGovernanceReview
      ? (pathDecision.matchedProtectedClass === "governance-registries" ? "REQUIRES_GOVERNANCE_REVIEW" : "DENY_PROTECTED_PATH")
      : "DENY";

  return {
    allowed: writeAllowed,
    writeAllowed,
    write_allowed: writeAllowed,
    denied: !writeAllowed,
    reason: allowedByClass
      ? "ALLOWED"
      : requiresGovernanceReview
        ? "GOVERNANCE_REVIEW_REQUIRED"
        : "PERMISSION_DENIED",
    decision,
    emergencyStopActive: false,
    emergency_stop_active: false,
    writeDisabled: false,
    write_disabled: false,
    dryRun: !executeWrite,
    dry_run: !executeWrite,
    requiresGovernanceReview,
    requires_governance_review: requiresGovernanceReview,
    protectedPathTouched: pathDecision.protectedPathTouched,
    protected_path_touched: pathDecision.protected_path_touched,
    matchedProtectedClass: pathDecision.matchedProtectedClass,
    matched_protected_class: pathDecision.matched_protected_class,
    checkRunWriteAllowed,
    check_run_write_allowed: checkRunWriteAllowed,
    projectionRepairAllowed,
    projection_repair_allowed: projectionRepairAllowed,
    quarantineIssueAllowed,
    quarantine_issue_allowed: quarantineIssueAllowed
  };
}
