export type ChainLockStage = {
  stage: number;
  claim_class: string;
  owner: string;
  object_ref: string;
  status: string;
};

export type ChainLockObject = {
  object_type: string;
  chain_lock_id: string;
  status: string;
  chain: ChainLockStage[];
};

export type ProjectionChain = {
  chain_stage_count?: number;
  chain_object_refs?: string[];
};

export type ChainLockFinding = {
  severity: "RED" | "YELLOW";
  code: string;
  message: string;
};

const EXPECTED_ORDER = [
  "law-version",
  "freeze-object",
  "accepted-epoch",
  "authority-object",
  "execution-receipt",
  "verification-result",
  "recognition-object",
  "recourse-object",
  "continuity-transfer"
];

export function assertChainlockProjectionConvergence(
  chainLock: ChainLockObject,
  projection: ProjectionChain
): ChainLockFinding[] {
  const findings: ChainLockFinding[] = [];

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

  if (chainLock.chain.length !== EXPECTED_ORDER.length) {
    findings.push({
      severity: "RED",
      code: "CHAINLOCK_STAGE_COUNT_INVALID",
      message: `Chain lock stage count ${chainLock.chain.length} does not match expected ${EXPECTED_ORDER.length}.`
    });
  }

  for (const [index, expected] of EXPECTED_ORDER.entries()) {
    const actual = chainLock.chain[index];
    if (!actual || actual.claim_class !== expected || actual.stage !== index + 1) {
      findings.push({
        severity: "RED",
        code: "CHAINLOCK_ORDER_MISMATCH",
        message: `Chain lock stage ${index + 1} must be ${expected}.`
      });
    }
  }

  for (const stage of chainLock.chain) {
    if (stage.status !== "ACTIVE_TRUTH") {
      findings.push({
        severity: "RED",
        code: "CHAINLOCK_STAGE_NOT_ACTIVE_TRUTH",
        message: `${stage.claim_class} is ${stage.status}, expected ACTIVE_TRUTH.`
      });
    }

    if (!/^https:\/\/github\.com\/Verifrax\//.test(stage.object_ref)) {
      findings.push({
        severity: "RED",
        code: "CHAINLOCK_OBJECT_REF_NOT_PUBLIC_GITHUB",
        message: `${stage.claim_class} object_ref must resolve to a public Verifrax GitHub object.`
      });
    }
  }

  if (projection.chain_stage_count !== undefined && projection.chain_stage_count !== chainLock.chain.length) {
    findings.push({
      severity: "RED",
      code: "PROJECTION_CHAIN_STAGE_COUNT_MISMATCH",
      message: `Projection chain stage count ${projection.chain_stage_count} does not match chain lock ${chainLock.chain.length}.`
    });
  }

  if (projection.chain_object_refs) {
    const lockedRefs = new Set(chainLock.chain.map((stage) => stage.object_ref));
    for (const ref of projection.chain_object_refs) {
      if (!lockedRefs.has(ref)) {
        findings.push({
          severity: "RED",
          code: "PROJECTION_CHAIN_OBJECT_SUBSTITUTION",
          message: `Projection references non-chainlocked object ${ref}.`
        });
      }
    }
  }

  return findings;
}
