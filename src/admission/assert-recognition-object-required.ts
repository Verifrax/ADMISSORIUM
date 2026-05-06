export type RecognitionObjectRequiredStatus = "green" | "yellow" | "red";

export interface RecognitionObjectRequiredFinding {
  status: RecognitionObjectRequiredStatus;
  code: string;
  message: string;
}

export interface RecognitionObjectRequiredReport {
  status: RecognitionObjectRequiredStatus;
  gate: "RECOGNITION_OBJECT_REQUIRED";
  findings: RecognitionObjectRequiredFinding[];
}

export interface RecognitionObjectRequiredInput {
  recognitionObject?: Record<string, unknown>;
  recognitionObjectIndex?: Record<string, unknown>;
  verificationResult?: Record<string, unknown>;
  replayBundle?: Record<string, unknown>;
  authorityObject?: Record<string, unknown>;
  freezeObject?: Record<string, unknown>;
  acceptedEpoch?: Record<string, unknown>;
  chainLock?: Record<string, unknown>;
  projection?: Record<string, unknown>;
}

const REQUIRED = {
  objectType: "RecognitionObject",
  recognitionObjectId: "recognition-object-0001",
  status: "ACTIVE_TRUTH",
  claimClass: "recognition-object",
  artifactId: "artifact-0005",
  verificationResultSuffix: "/verification/current/verification-result-0001.json",
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

export function assertRecognitionObjectRequired(
  input: RecognitionObjectRequiredInput,
): RecognitionObjectRequiredReport {
  const findings: RecognitionObjectRequiredFinding[] = [];

  const red = (code: string, message: string) =>
    findings.push({ status: "red", code, message });

  const yellow = (code: string, message: string) =>
    findings.push({ status: "yellow", code, message });

  const recognition = input.recognitionObject;

  if (!recognition) {
    red("RECOGNITION_OBJECT_MISSING", "recognition-object-0001 is absent.");
  } else {
    if (recognition.object_type !== REQUIRED.objectType) {
      red("RECOGNITION_OBJECT_WRONG_OBJECT_TYPE", "recognition object_type must be RecognitionObject.");
    }

    if (recognition.recognition_object_id !== REQUIRED.recognitionObjectId) {
      red("RECOGNITION_OBJECT_SUBSTITUTION", "recognition object id is not recognition-object-0001.");
    }

    if (recognition.status !== REQUIRED.status) {
      red("RECOGNITION_OBJECT_NOT_ACTIVE_TRUTH", "recognition object must be ACTIVE_TRUTH.");
    }

    if (recognition.claim_class !== REQUIRED.claimClass) {
      red("RECOGNITION_OBJECT_WRONG_CLAIM_CLASS", "recognition object must bind claim_class=recognition-object.");
    }

    if (recognition.artifact_id !== REQUIRED.artifactId) {
      red("RECOGNITION_OBJECT_WRONG_ARTIFACT", "recognition object must bind artifact-0005.");
    }

    if (recognition.recognition_passed !== true || recognition.terminal_recognition !== true) {
      red("RECOGNITION_OBJECT_NOT_TERMINAL", "recognition object must record terminal recognition.");
    }

    if (!suffix(recognition.verification_result_ref, REQUIRED.verificationResultSuffix)) {
      red("RECOGNITION_OBJECT_VERIFICATION_REF_DRIFT", "recognition object must bind verification-result-0001.");
    }

    if (!suffix(recognition.replay_bundle_ref, REQUIRED.replayBundleSuffix)) {
      red("RECOGNITION_OBJECT_REPLAY_BUNDLE_REF_DRIFT", "recognition object must bind replay-bundle-0001.");
    }

    if (!suffix(recognition.authority_object_ref, REQUIRED.authorityObjectSuffix)) {
      red("RECOGNITION_OBJECT_AUTHORITY_REF_DRIFT", "recognition object must bind authority-object-0001.");
    }

    if (!suffix(recognition.freeze_object_ref, REQUIRED.freezeObjectSuffix)) {
      red("RECOGNITION_OBJECT_FREEZE_REF_DRIFT", "recognition object must bind freeze-object-0001.");
    }

    if (!suffix(recognition.accepted_epoch_ref, REQUIRED.acceptedEpochSuffix)) {
      red("RECOGNITION_OBJECT_ACCEPTED_EPOCH_REF_DRIFT", "recognition object must bind accepted-epoch-0001.");
    }

    if (!suffix(recognition.chain_lock_ref, REQUIRED.chainLockSuffix)) {
      red("RECOGNITION_OBJECT_CHAIN_LOCK_REF_DRIFT", "recognition object must bind minimum-object-chain-lock-0001.");
    }

    if (recognition.recourse_ready !== false) {
      red("RECOGNITION_OBJECT_RECOURSE_READY_OVERCLAIM", "recognition object may not make recourse ready by itself.");
    }

    if (
      recognition.may_assign_recourse !== false ||
      recognition.may_select_remedy !== false ||
      recognition.may_close_recourse !== false
    ) {
      red("RECOGNITION_RECOURSE_COLLAPSE", "recognition object may not assign recourse, select remedy, or close recourse.");
    }

    if (
      recognition.may_mutate_verification !== false ||
      recognition.may_mutate_authority !== false ||
      recognition.may_mutate_accepted_epoch !== false
    ) {
      red("RECOGNITION_MUTATION_OVERCLAIM", "recognition object may not mutate verification, authority, or accepted epoch.");
    }

    if (recognition.may_infer_missing_truth !== false) {
      red("RECOGNITION_INFERENCE_OVERCLAIM", "recognition object may not infer missing truth.");
    }
  }

  const idx = input.recognitionObjectIndex;
  if (!idx || idx.current_recognition_object_ref !== "recognition/current/recognition-object-0001.json") {
    red("RECOGNITION_OBJECT_INDEX_DRIFT", "recognition object index must point to recognition-object-0001.");
  }

  if (input.verificationResult && input.verificationResult.verification_result_id !== "verification-result-0001") {
    red("VERIFICATION_RESULT_SUBSTITUTION", "bound verification result must be verification-result-0001.");
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
    for (const key of ["recognition_object_id", "recognitionObject", "recognition_object", "recognition"]) {
      if (hasOwn(input.projection, key)) {
        red("PROJECTION_ADDED_RECOGNITION_OBJECT", "projection surfaces may not add or substitute recognition object truth.");
      }
    }
  }

  const chain = input.chainLock?.chain;
  if (Array.isArray(chain)) {
    const classes = chain
      .map((item) => typeof item === "object" && item !== null ? (item as Record<string, unknown>).claim_class : undefined)
      .filter(Boolean);

    if (!classes.includes(REQUIRED.claimClass)) {
      yellow("CHAIN_LOCK_RECOGNITION_CLASS_NOT_VISIBLE", "active chain lock does not expose recognition-object claim class.");
    }
  }

  const status: RecognitionObjectRequiredStatus = findings.some((f) => f.status === "red")
    ? "red"
    : findings.some((f) => f.status === "yellow")
      ? "yellow"
      : "green";

  return {
    status,
    gate: "RECOGNITION_OBJECT_REQUIRED",
    findings,
  };
}
