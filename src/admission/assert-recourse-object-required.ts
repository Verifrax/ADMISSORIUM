export type RecourseObjectRequiredStatus = "green" | "yellow" | "red";

export interface RecourseObjectRequiredFinding {
  status: RecourseObjectRequiredStatus;
  code: string;
  message: string;
}

export interface RecourseObjectRequiredReport {
  status: RecourseObjectRequiredStatus;
  gate: "RECOURSE_OBJECT_REQUIRED";
  findings: RecourseObjectRequiredFinding[];
}

export interface RecourseObjectRequiredInput {
  recourseObject?: Record<string, unknown>;
  recourseObjectIndex?: Record<string, unknown>;
  recognitionObject?: Record<string, unknown>;
  verificationResult?: Record<string, unknown>;
  authorityObject?: Record<string, unknown>;
  freezeObject?: Record<string, unknown>;
  acceptedEpoch?: Record<string, unknown>;
  chainLock?: Record<string, unknown>;
  projection?: Record<string, unknown>;
}

const REQUIRED = {
  objectType: "RecourseObject",
  recourseObjectId: "recourse-object-0001",
  status: "ACTIVE_TRUTH",
  claimClass: "recourse-object",
  artifactId: "artifact-0005",
  recognitionObjectSuffix: "/recognition/current/recognition-object-0001.json",
  verificationResultSuffix: "/verification/current/verification-result-0001.json",
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

export function assertRecourseObjectRequired(
  input: RecourseObjectRequiredInput,
): RecourseObjectRequiredReport {
  const findings: RecourseObjectRequiredFinding[] = [];

  const red = (code: string, message: string) =>
    findings.push({ status: "red", code, message });

  const yellow = (code: string, message: string) =>
    findings.push({ status: "yellow", code, message });

  const recourse = input.recourseObject;

  if (!recourse) {
    red("RECOURSE_OBJECT_MISSING", "recourse-object-0001 is absent.");
  } else {
    if (recourse.object_type !== REQUIRED.objectType) {
      red("RECOURSE_OBJECT_WRONG_OBJECT_TYPE", "recourse object_type must be RecourseObject.");
    }

    if (recourse.recourse_object_id !== REQUIRED.recourseObjectId) {
      red("RECOURSE_OBJECT_SUBSTITUTION", "recourse object id is not recourse-object-0001.");
    }

    if (recourse.status !== REQUIRED.status) {
      red("RECOURSE_OBJECT_NOT_ACTIVE_TRUTH", "recourse object must be ACTIVE_TRUTH.");
    }

    if (recourse.claim_class !== REQUIRED.claimClass) {
      red("RECOURSE_OBJECT_WRONG_CLAIM_CLASS", "recourse object must bind claim_class=recourse-object.");
    }

    if (recourse.artifact_id !== REQUIRED.artifactId) {
      red("RECOURSE_OBJECT_WRONG_ARTIFACT", "recourse object must bind artifact-0005.");
    }

    if (!suffix(recourse.recognition_object_ref, REQUIRED.recognitionObjectSuffix)) {
      red("RECOURSE_OBJECT_RECOGNITION_REF_DRIFT", "recourse object must bind recognition-object-0001.");
    }

    if (!suffix(recourse.verification_result_ref, REQUIRED.verificationResultSuffix)) {
      red("RECOURSE_OBJECT_VERIFICATION_REF_DRIFT", "recourse object must bind verification-result-0001.");
    }

    if (!suffix(recourse.authority_object_ref, REQUIRED.authorityObjectSuffix)) {
      red("RECOURSE_OBJECT_AUTHORITY_REF_DRIFT", "recourse object must bind authority-object-0001.");
    }

    if (!suffix(recourse.freeze_object_ref, REQUIRED.freezeObjectSuffix)) {
      red("RECOURSE_OBJECT_FREEZE_REF_DRIFT", "recourse object must bind freeze-object-0001.");
    }

    if (!suffix(recourse.accepted_epoch_ref, REQUIRED.acceptedEpochSuffix)) {
      red("RECOURSE_OBJECT_ACCEPTED_EPOCH_REF_DRIFT", "recourse object must bind accepted-epoch-0001.");
    }

    if (!suffix(recourse.chain_lock_ref, REQUIRED.chainLockSuffix)) {
      red("RECOURSE_OBJECT_CHAIN_LOCK_REF_DRIFT", "recourse object must bind minimum-object-chain-lock-0001.");
    }

    if (recourse.recognized_truth_bound !== true) {
      red("RECOURSE_WITHOUT_BOUND_RECOGNITION", "recourse object must bind recognized truth before consequence.");
    }

    if (typeof recourse.claim_posture !== "string" || recourse.claim_posture.length === 0) {
      red("RECOURSE_CLAIM_POSTURE_MISSING", "recourse object must state claim posture.");
    }

    if (typeof recourse.burden_assignment !== "string" || recourse.burden_assignment.length === 0) {
      red("RECOURSE_BURDEN_ASSIGNMENT_MISSING", "recourse object must state burden assignment.");
    }

    if (typeof recourse.remedy_path !== "string" || recourse.remedy_path.length === 0) {
      red("RECOURSE_REMEDY_PATH_MISSING", "recourse object must state remedy path.");
    }

    if (typeof recourse.escalation_path !== "string" || recourse.escalation_path.length === 0) {
      red("RECOURSE_ESCALATION_PATH_MISSING", "recourse object must state escalation path.");
    }

    if (typeof recourse.closure_state !== "string" || recourse.closure_state.length === 0) {
      red("RECOURSE_CLOSURE_STATE_MISSING", "recourse object must state closure state.");
    }

    if (
      recourse.may_redefine_recognition !== false ||
      recourse.may_generate_recognition !== false ||
      recourse.may_mutate_recognition !== false
    ) {
      red("RECOURSE_RECOGNITION_COLLAPSE", "recourse object may not redefine, generate, or mutate recognition.");
    }

    if (
      recourse.may_mutate_verification !== false ||
      recourse.may_mutate_authority !== false ||
      recourse.may_mutate_accepted_epoch !== false ||
      recourse.may_mutate_chain_lock !== false
    ) {
      red("RECOURSE_MUTATION_OVERCLAIM", "recourse object may not mutate verification, authority, accepted epoch, or chain lock.");
    }

    if (recourse.may_infer_missing_truth !== false) {
      red("RECOURSE_INFERENCE_OVERCLAIM", "recourse object may not infer missing truth.");
    }
  }

  const idx = input.recourseObjectIndex;
  if (!idx || idx.current_recourse_object_ref !== "recourse/current/recourse-object-0001.json") {
    red("RECOURSE_OBJECT_INDEX_DRIFT", "recourse object index must point to recourse-object-0001.");
  }

  if (!input.recognitionObject || input.recognitionObject.recognition_object_id !== "recognition-object-0001") {
    red("BOUND_RECOGNITION_OBJECT_MISSING_OR_SUBSTITUTED", "recourse requires bound recognition-object-0001.");
  }

  if (input.recognitionObject && input.recognitionObject.terminal_recognition !== true) {
    red("BOUND_RECOGNITION_NOT_TERMINAL", "bound recognition object must be terminal before recourse.");
  }

  if (input.verificationResult && input.verificationResult.verification_result_id !== "verification-result-0001") {
    red("VERIFICATION_RESULT_SUBSTITUTION", "bound verification result must be verification-result-0001.");
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
    for (const key of ["recourse_object_id", "recourseObject", "recourse_object", "recourse"]) {
      if (hasOwn(input.projection, key)) {
        red("PROJECTION_ADDED_RECOURSE_OBJECT", "projection surfaces may not add or substitute recourse object truth.");
      }
    }
  }

  const chain = input.chainLock?.chain;
  if (Array.isArray(chain)) {
    const classes = chain
      .map((item) => typeof item === "object" && item !== null ? (item as Record<string, unknown>).claim_class : undefined)
      .filter(Boolean);

    if (!classes.includes(REQUIRED.claimClass)) {
      yellow("CHAIN_LOCK_RECOURSE_CLASS_NOT_VISIBLE", "active chain lock does not expose recourse-object claim class.");
    }
  }

  const status: RecourseObjectRequiredStatus = findings.some((f) => f.status === "red")
    ? "red"
    : findings.some((f) => f.status === "yellow")
      ? "yellow"
      : "green";

  return {
    status,
    gate: "RECOURSE_OBJECT_REQUIRED",
    findings,
  };
}
