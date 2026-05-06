export type AdmittedClaimClass = {
  order: number;
  claim_class: string;
  owner: string;
  required: boolean;
};

export type ClaimClassAdmissionObject = {
  object_type: string;
  status: string;
  admitted_claim_classes: AdmittedClaimClass[];
};

export type AcceptedClaimClassStateObject = {
  object_type: string;
  status: string;
  accepted_claim_classes: string[];
};

export type ChainLockObject = {
  object_type: string;
  status: string;
  chain: Array<{
    stage: number;
    claim_class: string;
    owner: string;
    object_ref: string;
    status: string;
  }>;
};

export type ClaimClassAdmissionFinding = {
  severity: "RED" | "YELLOW";
  code: string;
  message: string;
};

function orderedLawClasses(admission: ClaimClassAdmissionObject): string[] {
  return [...admission.admitted_claim_classes]
    .sort((a, b) => a.order - b.order)
    .map((x) => x.claim_class);
}

function orderedChainClasses(chainLock: ChainLockObject): string[] {
  return [...chainLock.chain]
    .sort((a, b) => a.stage - b.stage)
    .map((x) => x.claim_class);
}

function sameOrder(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((x, i) => x === right[i]);
}

export function assertClaimClassAdmissionRequired(
  admission: ClaimClassAdmissionObject,
  acceptedState: AcceptedClaimClassStateObject,
  chainLock: ChainLockObject
): ClaimClassAdmissionFinding[] {
  const findings: ClaimClassAdmissionFinding[] = [];

  if (admission.object_type !== "ClaimClassAdmission") {
    findings.push({
      severity: "RED",
      code: "CLAIM_CLASS_ADMISSION_WRONG_OBJECT_TYPE",
      message: "Claim-class admission object_type must be ClaimClassAdmission."
    });
  }

  if (admission.status !== "ACTIVE_LAW") {
    findings.push({
      severity: "RED",
      code: "CLAIM_CLASS_ADMISSION_NOT_ACTIVE_LAW",
      message: "Claim-class admission must be ACTIVE_LAW."
    });
  }

  if (acceptedState.object_type !== "AcceptedClaimClassState") {
    findings.push({
      severity: "RED",
      code: "ACCEPTED_CLAIM_CLASS_STATE_WRONG_OBJECT_TYPE",
      message: "Accepted claim-class state object_type must be AcceptedClaimClassState."
    });
  }

  if (acceptedState.status !== "ACTIVE_TRUTH") {
    findings.push({
      severity: "RED",
      code: "ACCEPTED_CLAIM_CLASS_STATE_NOT_ACTIVE_TRUTH",
      message: "Accepted claim-class state must be ACTIVE_TRUTH."
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

  const lawClasses = orderedLawClasses(admission);
  const acceptedClasses = acceptedState.accepted_claim_classes;
  const chainClasses = orderedChainClasses(chainLock);

  if (!sameOrder(lawClasses, acceptedClasses)) {
    findings.push({
      severity: "RED",
      code: "CLAIM_CLASS_LAW_STATE_MISMATCH",
      message: "Claim-class law order does not match accepted claim-class state."
    });
  }

  if (!sameOrder(acceptedClasses, chainClasses)) {
    findings.push({
      severity: "RED",
      code: "ACCEPTED_CLAIM_CLASS_CHAINLOCK_MISMATCH",
      message: "Accepted claim-class state does not match active chain lock."
    });
  }

  for (const cls of admission.admitted_claim_classes) {
    if (cls.required !== true) {
      findings.push({
        severity: "YELLOW",
        code: "CLAIM_CLASS_NOT_REQUIRED",
        message: `${cls.claim_class} is admitted but not required.`
      });
    }
  }

  return findings;
}
