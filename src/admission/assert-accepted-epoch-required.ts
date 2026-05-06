export type AcceptedEpochCounts = {
  governed_repository_count: number;
  public_repository_count: number;
  sovereign_chamber_count: number;
  host_count: number;
  npm_package_count: number;
  core_package_order_count: number;
  pypi_package_boundary_count: number;
  private_internal_package_count: number;
};

export type AcceptedEpochObject = {
  object_type: string;
  accepted_epoch_id: string;
  status: string;
  epoch_stage_count: number;
  accepted_claim_classes: string[];
  accepted_counts: AcceptedEpochCounts;
};

export type ChainLockObject = {
  object_type: string;
  status: string;
  accepted_epoch_ref?: string;
  chain: Array<{
    stage: number;
    claim_class: string;
    status: string;
  }>;
};

export type AdmissionsObject = {
  status: string;
  count_policy: AcceptedEpochCounts;
};

export type AcceptedEpochFinding = {
  severity: "RED" | "YELLOW";
  code: string;
  message: string;
};

function orderedChainClasses(chainLock: ChainLockObject): string[] {
  return [...chainLock.chain]
    .sort((a, b) => a.stage - b.stage)
    .map((x) => x.claim_class);
}

function sameOrder(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((x, i) => x === right[i]);
}

export function assertAcceptedEpochRequired(
  epoch: AcceptedEpochObject,
  chainLock: ChainLockObject,
  admissions: AdmissionsObject
): AcceptedEpochFinding[] {
  const findings: AcceptedEpochFinding[] = [];

  if (epoch.object_type !== "AcceptedEpoch") {
    findings.push({
      severity: "RED",
      code: "ACCEPTED_EPOCH_WRONG_OBJECT_TYPE",
      message: "Accepted epoch object_type must be AcceptedEpoch."
    });
  }

  if (epoch.accepted_epoch_id !== "accepted-epoch-0001") {
    findings.push({
      severity: "RED",
      code: "ACCEPTED_EPOCH_ID_MISMATCH",
      message: "Accepted epoch id must be accepted-epoch-0001."
    });
  }

  if (epoch.status !== "ACTIVE_TRUTH") {
    findings.push({
      severity: "RED",
      code: "ACCEPTED_EPOCH_NOT_ACTIVE_TRUTH",
      message: "Accepted epoch must be ACTIVE_TRUTH."
    });
  }

  if (chainLock.object_type !== "MinimumObjectChainLock") {
    findings.push({
      severity: "RED",
      code: "CHAINLOCK_WRONG_OBJECT_TYPE",
      message: "Chain lock object_type must be MinimumObjectChainLock."
    });
  }

  if (chainLock.status !== "ACTIVE_TRUTH") {
    findings.push({
      severity: "RED",
      code: "CHAINLOCK_NOT_ACTIVE_TRUTH",
      message: "Chain lock must be ACTIVE_TRUTH."
    });
  }

  if (admissions.status !== "ACTIVE_TRUTH") {
    findings.push({
      severity: "RED",
      code: "ADMISSIONS_NOT_ACTIVE_TRUTH",
      message: "Admissions object must be ACTIVE_TRUTH."
    });
  }

  const chainClasses = orderedChainClasses(chainLock);

  if (epoch.epoch_stage_count !== chainClasses.length) {
    findings.push({
      severity: "RED",
      code: "ACCEPTED_EPOCH_STAGE_COUNT_MISMATCH",
      message: `Accepted epoch stage count ${epoch.epoch_stage_count} does not match chain stage count ${chainClasses.length}.`
    });
  }

  if (!sameOrder(epoch.accepted_claim_classes, chainClasses)) {
    findings.push({
      severity: "RED",
      code: "ACCEPTED_EPOCH_CHAIN_CLASS_MISMATCH",
      message: "Accepted epoch claim classes do not match active chain lock."
    });
  }

  for (const [key, accepted] of Object.entries(admissions.count_policy) as Array<[keyof AcceptedEpochCounts, number]>) {
    if (epoch.accepted_counts[key] !== accepted) {
      findings.push({
        severity: "RED",
        code: `ACCEPTED_EPOCH_COUNT_MISMATCH_${String(key).toUpperCase()}`,
        message: `Accepted epoch count ${String(key)}=${epoch.accepted_counts[key]} does not match admissions count ${accepted}.`
      });
    }
  }

  if (
    chainLock.accepted_epoch_ref &&
    !chainLock.accepted_epoch_ref.endsWith("/epochs/current/accepted-epoch-0001.json")
  ) {
    findings.push({
      severity: "RED",
      code: "CHAINLOCK_ACCEPTED_EPOCH_REF_MISMATCH",
      message: "Chain lock accepted_epoch_ref does not point to accepted-epoch-0001."
    });
  }

  return findings;
}
