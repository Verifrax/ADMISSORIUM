export type ContinuityTransferRequiredStatus = "green" | "yellow" | "red";

export interface ContinuityTransferRequiredFinding {
  status: ContinuityTransferRequiredStatus;
  code: string;
  message: string;
}

export interface ContinuityTransferRequiredReport {
  status: ContinuityTransferRequiredStatus;
  gate: "CONTINUITY_TRANSFER_REQUIRED";
  findings: ContinuityTransferRequiredFinding[];
}

export interface ContinuityTransferRequiredInput {
  continuityTransferObject?: Record<string, unknown>;
  continuityTransferIndex?: Record<string, unknown>;
  authorityObject?: Record<string, unknown>;
  acceptedEpoch?: Record<string, unknown>;
  chainLock?: Record<string, unknown>;
  recognitionObject?: Record<string, unknown>;
  recourseObject?: Record<string, unknown>;
  projection?: Record<string, unknown>;
}

const REQUIRED = {
  objectType: "ContinuityTransferObject",
  continuityTransferId: "continuity-transfer-0001",
  status: "ACTIVE_TRUTH",
  claimClass: "continuity-transfer",
  chainLockSuffix: "/chains/current/minimum-object-chain-lock-0001.json",
  acceptedEpochSuffix: "/epochs/current/accepted-epoch-0001.json",
  authorityObjectSuffix: "/authorities/current/authority-object-0001.json",
  recognitionObjectSuffix: "/recognition/current/recognition-object-0001.json",
  recourseObjectSuffix: "/recourse/current/recourse-object-0001.json",
};

function suffix(value: unknown, expected: string): boolean {
  return typeof value === "string" && value.endsWith(expected);
}

function hasOwn(obj: Record<string, unknown> | undefined, key: string): boolean {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}

export function assertContinuityTransferRequired(
  input: ContinuityTransferRequiredInput,
): ContinuityTransferRequiredReport {
  const findings: ContinuityTransferRequiredFinding[] = [];

  const red = (code: string, message: string) =>
    findings.push({ status: "red", code, message });

  const yellow = (code: string, message: string) =>
    findings.push({ status: "yellow", code, message });

  const continuity = input.continuityTransferObject;

  if (!continuity) {
    red("CONTINUITY_TRANSFER_OBJECT_MISSING", "continuity-transfer-0001 is absent.");
  } else {
    if (continuity.object_type !== REQUIRED.objectType) {
      red("CONTINUITY_TRANSFER_WRONG_OBJECT_TYPE", "continuity object_type must be ContinuityTransferObject.");
    }

    if (continuity.continuity_transfer_id !== REQUIRED.continuityTransferId) {
      red("CONTINUITY_TRANSFER_SUBSTITUTION", "continuity transfer object id is not continuity-transfer-0001.");
    }

    if (continuity.status !== REQUIRED.status) {
      red("CONTINUITY_TRANSFER_NOT_ACTIVE_TRUTH", "continuity transfer object must be ACTIVE_TRUTH.");
    }

    if (continuity.claim_class !== REQUIRED.claimClass) {
      red("CONTINUITY_TRANSFER_WRONG_CLAIM_CLASS", "continuity transfer object must bind claim_class=continuity-transfer.");
    }

    if (!suffix(continuity.chain_lock_ref, REQUIRED.chainLockSuffix)) {
      red("CONTINUITY_TRANSFER_CHAIN_LOCK_REF_DRIFT", "continuity transfer object must bind minimum-object-chain-lock-0001.");
    }

    if (!suffix(continuity.accepted_epoch_ref, REQUIRED.acceptedEpochSuffix)) {
      red("CONTINUITY_TRANSFER_ACCEPTED_EPOCH_REF_DRIFT", "continuity transfer object must bind accepted-epoch-0001.");
    }

    if (!suffix(continuity.authority_object_ref, REQUIRED.authorityObjectSuffix)) {
      red("CONTINUITY_TRANSFER_AUTHORITY_REF_DRIFT", "continuity transfer object must bind authority-object-0001.");
    }

    if (!suffix(continuity.recognition_object_ref, REQUIRED.recognitionObjectSuffix)) {
      red("CONTINUITY_TRANSFER_RECOGNITION_REF_DRIFT", "continuity transfer object must bind recognition-object-0001.");
    }

    if (!suffix(continuity.recourse_object_ref, REQUIRED.recourseObjectSuffix)) {
      red("CONTINUITY_TRANSFER_RECOURSE_REF_DRIFT", "continuity transfer object must bind recourse-object-0001.");
    }

    if (continuity.recorded_not_narrated !== true) {
      red("CONTINUITY_TRANSFER_NOT_RECORDED", "continuity transfer must be recorded, not narrated.");
    }

    if (continuity.append_only_continuity !== true) {
      red("CONTINUITY_TRANSFER_NOT_APPEND_ONLY", "continuity transfer must preserve append-only continuity.");
    }

    if (continuity.historical_chain_reconstructable !== true) {
      red("CONTINUITY_TRANSFER_NOT_RECONSTRUCTABLE", "continuity transfer must preserve historical chain reconstructability.");
    }

    if (continuity.requires_public_transfer_record_for_future_custody_change !== true) {
      red("FUTURE_TRANSFER_RECORD_REQUIREMENT_MISSING", "future custody change must require public transfer record.");
    }

    if (
      continuity.may_transfer_authority_without_record !== false ||
      continuity.may_mutate_authority_object !== false ||
      continuity.may_mutate_accepted_epoch !== false ||
      continuity.may_mutate_chain_lock !== false
    ) {
      red("CONTINUITY_TRANSFER_AUTHORITY_OVERCLAIM", "continuity transfer may not execute authority transfer or mutate authority/state/chain objects.");
    }

    if (
      continuity.may_mutate_recognition !== false ||
      continuity.may_mutate_recourse !== false
    ) {
      red("CONTINUITY_TRANSFER_TERMINAL_OVERCLAIM", "continuity transfer may not mutate recognition or recourse.");
    }

    if (continuity.may_infer_missing_truth !== false) {
      red("CONTINUITY_TRANSFER_INFERENCE_OVERCLAIM", "continuity transfer may not infer missing truth.");
    }
  }

  const idx = input.continuityTransferIndex;
  if (!idx || idx.current_continuity_transfer_ref !== "governance/continuity/current/continuity-transfer-0001.json") {
    red("CONTINUITY_TRANSFER_INDEX_DRIFT", "continuity transfer index must point to continuity-transfer-0001.");
  }

  if (input.authorityObject && input.authorityObject.authority_object_id !== "authority-object-0001") {
    red("AUTHORITY_OBJECT_SUBSTITUTION", "bound authority object must be authority-object-0001.");
  }

  if (input.acceptedEpoch && input.acceptedEpoch.accepted_epoch_id !== "accepted-epoch-0001") {
    red("ACCEPTED_EPOCH_SUBSTITUTION", "bound accepted epoch must be accepted-epoch-0001.");
  }

  if (input.recognitionObject && input.recognitionObject.recognition_object_id !== "recognition-object-0001") {
    red("RECOGNITION_OBJECT_SUBSTITUTION", "bound recognition object must be recognition-object-0001.");
  }

  if (input.recourseObject && input.recourseObject.recourse_object_id !== "recourse-object-0001") {
    red("RECOURSE_OBJECT_SUBSTITUTION", "bound recourse object must be recourse-object-0001.");
  }

  if (input.projection) {
    for (const key of ["continuity_transfer_id", "continuityTransfer", "continuity_transfer", "transfer"]) {
      if (hasOwn(input.projection, key)) {
        red("PROJECTION_ADDED_CONTINUITY_TRANSFER", "projection surfaces may not add or substitute continuity transfer truth.");
      }
    }
  }

  const chain = input.chainLock?.chain;
  if (Array.isArray(chain)) {
    const classes = chain
      .map((item) => typeof item === "object" && item !== null ? (item as Record<string, unknown>).claim_class : undefined)
      .filter(Boolean);

    if (!classes.includes(REQUIRED.claimClass)) {
      yellow("CHAIN_LOCK_CONTINUITY_TRANSFER_CLASS_NOT_VISIBLE", "active chain lock does not expose continuity-transfer claim class.");
    }
  }

  const status: ContinuityTransferRequiredStatus = findings.some((f) => f.status === "red")
    ? "red"
    : findings.some((f) => f.status === "yellow")
      ? "yellow"
      : "green";

  return {
    status,
    gate: "CONTINUITY_TRANSFER_REQUIRED",
    findings,
  };
}
