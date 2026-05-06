export type VerificationResultRequiredStatus = "green" | "yellow" | "red";

export interface VerificationResultRequiredFinding {
  status: VerificationResultRequiredStatus;
  code: string;
  message: string;
}

export interface VerificationResultRequiredReport {
  status: VerificationResultRequiredStatus;
  gate: "VERIFICATION_RESULT_REQUIRED";
  findings: VerificationResultRequiredFinding[];
}

export interface VerificationResultRequiredInput {
  verificationResult?: Record<string, unknown>;
  verificationResultIndex?: Record<string, unknown>;
  replayBundle?: Record<string, unknown>;
  authorityObject?: Record<string, unknown>;
  freezeObject?: Record<string, unknown>;
  acceptedEpoch?: Record<string, unknown>;
  chainLock?: Record<string, unknown>;
  projection?: Record<string, unknown>;
}

const REQUIRED = {
  objectType: "VerificationResult",
  verificationResultId: "verification-result-0001",
  status: "ACTIVE_TRUTH",
  claimClass: "verification-result",
  artifactId: "artifact-0005",
  replayBundleSuffix: "/replay/current/replay-bundle-0001.json",
  authorityObjectSuffix: "/authorities/current/authority-object-0001.json",
  freezeObjectSuffix: "/freeze/objects/current/freeze-object-0001.json",
  acceptedEpochSuffix: "/epochs/current/accepted-epoch-0001.json",
  chainLockSuffix: "/chains/current/minimum-object-chain-lock-0001.json",
};

function suffix(value: unknown, expected: string): boolean {
  return typeof value === "string" && value.endsWith(expected);
}

function hasOwn(obj: Record<string, unknown> | undefined, key: string): boolean {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}

export function assertVerificationResultRequired(
  input: VerificationResultRequiredInput,
): VerificationResultRequiredReport {
  const findings: VerificationResultRequiredFinding[] = [];

  const red = (code: string, message: string) =>
    findings.push({ status: "red", code, message });

  const yellow = (code: string, message: string) =>
    findings.push({ status: "yellow", code, message });

  const vr = input.verificationResult;

  if (!vr) {
    red("VERIFICATION_RESULT_MISSING", "verification-result-0001 is absent.");
  } else {
    if (vr.object_type !== REQUIRED.objectType) {
      red("VERIFICATION_RESULT_WRONG_OBJECT_TYPE", "verification result object_type must be VerificationResult.");
    }

    if (vr.verification_result_id !== REQUIRED.verificationResultId) {
      red("VERIFICATION_RESULT_SUBSTITUTION", "verification result id is not verification-result-0001.");
    }

    if (vr.status !== REQUIRED.status) {
      red("VERIFICATION_RESULT_NOT_ACTIVE_TRUTH", "verification result must be ACTIVE_TRUTH.");
    }

    if (vr.claim_class !== REQUIRED.claimClass) {
      red("VERIFICATION_RESULT_WRONG_CLAIM_CLASS", "verification result must bind claim_class=verification-result.");
    }

    if (vr.artifact_id !== REQUIRED.artifactId) {
      red("VERIFICATION_RESULT_WRONG_ARTIFACT", "verification result must bind artifact-0005.");
    }

    if (vr.verification_passed !== true) {
      red("VERIFICATION_RESULT_NOT_PASSED", "verification result must pass before later recognition surfaces.");
    }

    if (!suffix(vr.replay_bundle_ref, REQUIRED.replayBundleSuffix)) {
      red("VERIFICATION_RESULT_REPLAY_BUNDLE_REF_DRIFT", "verification result must bind replay-bundle-0001.");
    }

    if (!suffix(vr.authority_object_ref, REQUIRED.authorityObjectSuffix)) {
      red("VERIFICATION_RESULT_AUTHORITY_REF_DRIFT", "verification result must bind authority-object-0001.");
    }

    if (!suffix(vr.freeze_object_ref, REQUIRED.freezeObjectSuffix)) {
      red("VERIFICATION_RESULT_FREEZE_REF_DRIFT", "verification result must bind freeze-object-0001.");
    }

    if (!suffix(vr.accepted_epoch_ref, REQUIRED.acceptedEpochSuffix)) {
      red("VERIFICATION_RESULT_ACCEPTED_EPOCH_REF_DRIFT", "verification result must bind accepted-epoch-0001.");
    }

    if (!suffix(vr.chain_lock_ref, REQUIRED.chainLockSuffix)) {
      red("VERIFICATION_RESULT_CHAIN_LOCK_REF_DRIFT", "verification result must bind minimum-object-chain-lock-0001.");
    }

    if (vr.may_recognize_terminal_truth !== false) {
      red("VERIFICATION_RESULT_RECOGNITION_COLLAPSE", "verification result may not recognize terminal truth.");
    }

    if (vr.may_assign_recourse !== false) {
      red("VERIFICATION_RESULT_RECOURSE_COLLAPSE", "verification result may not assign recourse.");
    }

    if (vr.may_mutate_authority !== false || vr.may_mutate_accepted_epoch !== false) {
      red("VERIFICATION_RESULT_MUTATION_OVERCLAIM", "verification result may not mutate authority or accepted epoch.");
    }

    if (vr.may_infer_missing_truth !== false) {
      red("VERIFICATION_RESULT_INFERENCE_OVERCLAIM", "verification result may not infer missing truth.");
    }
  }

  const idx = input.verificationResultIndex;
  if (!idx || idx.current_verification_result_ref !== "verification/current/verification-result-0001.json") {
    red("VERIFICATION_RESULT_INDEX_DRIFT", "verification result index must point to verification-result-0001.");
  }

  if (input.replayBundle && input.replayBundle.replay_bundle_id !== "replay-bundle-0001") {
    red("REPLAY_BUNDLE_SUBSTITUTION", "bound replay bundle must be replay-bundle-0001.");
  }

  if (input.authorityObject && input.authorityObject.authority_object_id !== "authority-object-0001") {
    red("AUTHORITY_OBJECT_SUBSTITUTION", "bound authority object must be authority-object-0001.");
  }

  if (input.freezeObject && input.freezeObject.freeze_object_id !== "freeze-object-0001") {
    red("FREEZE_OBJECT_SUBSTITUTION", "bound freeze object must be freeze-object-0001.");
  }

  if (input.acceptedEpoch && input.acceptedEpoch.accepted_epoch_id !== "accepted-epoch-0001") {
    red("ACCEPTED_EPOCH_SUBSTITUTION", "bound accepted epoch must be accepted-epoch-0001.");
  }

  if (input.projection) {
    for (const key of ["verification_result_id", "verificationResult", "verification_result", "verification"]) {
      if (hasOwn(input.projection, key)) {
        red("PROJECTION_ADDED_VERIFICATION_RESULT", "projection surfaces may not add or substitute verification result truth.");
      }
    }
  }

  const chain = input.chainLock?.chain;
  if (Array.isArray(chain)) {
    const classes = chain
      .map((item) => typeof item === "object" && item !== null ? (item as Record<string, unknown>).claim_class : undefined)
      .filter(Boolean);

    if (!classes.includes(REQUIRED.claimClass)) {
      yellow("CHAIN_LOCK_VERIFICATION_CLASS_NOT_VISIBLE", "active chain lock does not expose verification-result claim class.");
    }
  }

  const status: VerificationResultRequiredStatus = findings.some((f) => f.status === "red")
    ? "red"
    : findings.some((f) => f.status === "yellow")
      ? "yellow"
      : "green";

  return {
    status,
    gate: "VERIFICATION_RESULT_REQUIRED",
    findings,
  };
}
