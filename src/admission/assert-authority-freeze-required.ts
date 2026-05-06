export type AuthorityFreezeRequiredInput = {
  freezeObject: Record<string, unknown>;
  authorityObject: Record<string, unknown>;
  acceptedEpoch: Record<string, unknown>;
  chainLock: Record<string, unknown>;
};

export type AuthorityFreezeFinding = {
  severity: "RED" | "YELLOW";
  code: string;
  message: string;
};

export type AuthorityFreezeRequiredReport = {
  gate: "AUTHORITY_FREEZE_REQUIRED";
  status: "PASS" | "FAIL";
  truthWarning: "ADMISSORIUM_NOT_TRUTH_SOURCE";
  findings: AuthorityFreezeFinding[];
};

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function bool(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function hasRef(value: unknown, suffix: string): boolean {
  return text(value).endsWith(suffix);
}

function red(findings: AuthorityFreezeFinding[], code: string, message: string): void {
  findings.push({ severity: "RED", code, message });
}

export function assertAuthorityFreezeRequired(
  input: AuthorityFreezeRequiredInput,
): AuthorityFreezeRequiredReport {
  const findings: AuthorityFreezeFinding[] = [];
  const { freezeObject, authorityObject, acceptedEpoch, chainLock } = input;

  if (freezeObject.status !== "ACTIVE_TRUTH") {
    red(findings, "FREEZE_OBJECT_NOT_ACTIVE_TRUTH", "Freeze object must be ACTIVE_TRUTH.");
  }

  if (authorityObject.status !== "ACTIVE_TRUTH") {
    red(findings, "AUTHORITY_OBJECT_NOT_ACTIVE_TRUTH", "Authority object must be ACTIVE_TRUTH.");
  }

  if (!JSON.stringify(freezeObject).includes("freeze-object-0001")) {
    red(findings, "FREEZE_OBJECT_ID_MISSING", "Freeze object must bind freeze-object-0001.");
  }

  if (!hasRef(authorityObject.freeze_object_ref, "/freeze/objects/current/freeze-object-0001.json")) {
    red(findings, "AUTHORITY_FREEZE_REF_SUBSTITUTED", "Authority object must bind the current freeze-object-0001 path.");
  }

  if (!hasRef(authorityObject.accepted_epoch_ref, "/epochs/current/accepted-epoch-0001.json")) {
    red(findings, "AUTHORITY_ACCEPTED_EPOCH_REF_SUBSTITUTED", "Authority object must bind accepted-epoch-0001.");
  }

  if (!hasRef(authorityObject.chain_lock_ref, "/chains/current/minimum-object-chain-lock-0001.json")) {
    red(findings, "AUTHORITY_CHAIN_LOCK_REF_SUBSTITUTED", "Authority object must bind minimum-object-chain-lock-0001.");
  }

  if (bool(authorityObject.may_issue_authority_for_scope) !== true) {
    red(findings, "AUTHORITY_SCOPE_ISSUANCE_NOT_ALLOWED", "Authority object must allow authority issuance only for its declared scope.");
  }

  for (const key of [
    "may_mutate_law",
    "may_mutate_accepted_state",
    "may_mutate_freeze_object",
    "may_infer_missing_truth",
  ]) {
    if (bool(authorityObject[key]) !== false) {
      red(findings, "AUTHORITY_ROLE_OVERCLAIM", `Authority object must not overclaim ${key}.`);
    }
  }

  if (!JSON.stringify(acceptedEpoch).includes("accepted-epoch-0001")) {
    red(findings, "ACCEPTED_EPOCH_CONTEXT_MISSING", "Accepted epoch context must bind accepted-epoch-0001.");
  }

  if (!JSON.stringify(chainLock).includes("minimum-object-chain-lock-0001")) {
    red(findings, "CHAIN_LOCK_CONTEXT_MISSING", "Chain lock context must bind minimum-object-chain-lock-0001.");
  }

  return {
    gate: "AUTHORITY_FREEZE_REQUIRED",
    status: findings.some((f) => f.severity === "RED") ? "FAIL" : "PASS",
    truthWarning: "ADMISSORIUM_NOT_TRUTH_SOURCE",
    findings,
  };
}
