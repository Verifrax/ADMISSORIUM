export type ActiveHistoricalTruthTypingStatus = "green" | "yellow" | "red";

export interface ActiveHistoricalTruthTypingFinding {
  status: ActiveHistoricalTruthTypingStatus;
  code: string;
  message: string;
}

export interface ActiveHistoricalTruthTypingReport {
  status: ActiveHistoricalTruthTypingStatus;
  gate: "ACTIVE_HISTORICAL_TRUTH_TYPING_REQUIRED";
  findings: ActiveHistoricalTruthTypingFinding[];
}

export interface ActiveHistoricalTruthTypingInput {
  truthTyping?: Record<string, unknown>;
  truthTypingIndex?: Record<string, unknown>;
  projection?: Record<string, unknown>;
  statusSurface?: Record<string, unknown>;
  historicalSnapshot?: Record<string, unknown>;
}

const REQUIRED_CATEGORIES = [
  "ACTIVE_LAW",
  "ACTIVE_TRUTH",
  "ACTIVE_INDEX",
  "EVIDENCE_OBJECT",
  "HISTORICAL_SNAPSHOT",
  "DERIVED_PROJECTION",
  "STATUS_SURFACE_NOT_TRUTH_SOURCE",
  "QUARANTINED",
  "TRANSITIONAL",
];

const REQUIRED_FAMILIES = [
  "claim-class-admission",
  "accepted-claim-class-state",
  "chain-lock",
  "accepted-epoch",
  "freeze-object",
  "authority-object",
  "replay-bundle",
  "verification-result",
  "recognition-object",
  "recourse-object",
  "continuity-transfer",
];

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
}

function currentTruthFamilies(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (typeof entry !== "object" || entry === null) return undefined;
      const family = (entry as Record<string, unknown>).object_family;
      return typeof family === "string" ? family : undefined;
    })
    .filter((family): family is string => typeof family === "string");
}

function hasDuplicate(values: string[]): boolean {
  return new Set(values).size !== values.length;
}

function isActiveTruthClaim(value: Record<string, unknown> | undefined): boolean {
  if (!value) return false;

  return value.status === "ACTIVE_TRUTH" ||
    value.truth_kind === "ACTIVE_TRUTH" ||
    value.truth_status === "ACTIVE_TRUTH" ||
    value.is_truth_source === true ||
    value.truth_source === true;
}

export function assertActiveHistoricalTruthTypingRequired(
  input: ActiveHistoricalTruthTypingInput,
): ActiveHistoricalTruthTypingReport {
  const findings: ActiveHistoricalTruthTypingFinding[] = [];
  const red = (code: string, message: string) => findings.push({ status: "red", code, message });

  const typing = input.truthTyping;

  if (!typing) {
    red("ACTIVE_HISTORICAL_TRUTH_TYPING_MISSING", "active-historical-truth-typing-0001 is absent.");
  } else {
    if (typing.object_type !== "ActiveHistoricalTruthTyping") {
      red("TRUTH_TYPING_WRONG_OBJECT_TYPE", "truth typing object_type must be ActiveHistoricalTruthTyping.");
    }

    if (typing.typing_id !== "active-historical-truth-typing-0001") {
      red("TRUTH_TYPING_SUBSTITUTION", "truth typing id must be active-historical-truth-typing-0001.");
    }

    if (typing.status !== "ACTIVE_TRUTH") {
      red("TRUTH_TYPING_NOT_ACTIVE_TRUTH", "truth typing object must be ACTIVE_TRUTH.");
    }

    const categories = stringArray(typing.truth_categories);
    for (const category of REQUIRED_CATEGORIES) {
      if (!categories.includes(category)) red("TRUTH_CATEGORY_MISSING", `truth typing must include ${category}.`);
    }

    const families = currentTruthFamilies(typing.current_truth_refs);
    for (const family of REQUIRED_FAMILIES) {
      if (!families.includes(family)) red("CURRENT_TRUTH_FAMILY_MISSING", `truth typing must bind current object family ${family}.`);
    }

    if (hasDuplicate(families)) {
      red("DUPLICATE_ACTIVE_TRUTH_FAMILY", "truth typing must preserve one active truth per object family.");
    }

    if (typing.current_truth_policy !== "ONE_ACTIVE_TRUTH_PER_OBJECT_FAMILY") {
      red("CURRENT_TRUTH_POLICY_MISSING", "truth typing must declare one active truth per object family.");
    }

    if (typing.historical_material_policy !== "MUST_SELF_IDENTIFY_AS_HISTORICAL") {
      red("HISTORICAL_TYPING_POLICY_MISSING", "historical material must self-identify as historical.");
    }

    if (typing.projection_policy !== "PROJECTIONS_NEVER_ACTIVE_TRUTH") {
      red("PROJECTION_TYPING_POLICY_MISSING", "projections must never type themselves as active truth.");
    }

    if (typing.status_surface_policy !== "STATUS_SURFACES_NOT_TRUTH_SOURCE") {
      red("STATUS_SURFACE_TYPING_POLICY_MISSING", "status surfaces must be typed as non-truth-source.");
    }

    if (
      typing.may_promote_projection_to_truth !== false ||
      typing.may_promote_status_to_truth !== false ||
      typing.may_promote_historical_snapshot_to_current !== false ||
      typing.may_infer_missing_truth !== false
    ) {
      red("TRUTH_TYPING_PROMOTION_OVERCLAIM", "typing object may not promote projections/status/historical snapshots or infer missing truth.");
    }
  }

  const idx = input.truthTypingIndex;
  if (!idx || idx.current_truth_typing_ref !== "truth-typing/current/active-historical-truth-typing-0001.json") {
    red("TRUTH_TYPING_INDEX_DRIFT", "truth typing index must point to active-historical-truth-typing-0001.");
  }

  if (isActiveTruthClaim(input.projection)) {
    red("PROJECTION_CLAIMS_ACTIVE_TRUTH", "projection surface may not claim ACTIVE_TRUTH or truth-source status.");
  }

  if (isActiveTruthClaim(input.statusSurface)) {
    red("STATUS_SURFACE_CLAIMS_TRUTH_SOURCE", "status surface may not claim ACTIVE_TRUTH or truth-source status.");
  }

  if (input.historicalSnapshot) {
    if (input.historicalSnapshot.status === "ACTIVE_TRUTH" || input.historicalSnapshot.truth_kind === "ACTIVE_TRUTH") {
      red("HISTORICAL_SNAPSHOT_CLAIMS_ACTIVE_TRUTH", "historical snapshot may not impersonate active truth.");
    }

    if (input.historicalSnapshot.historical_status !== "HISTORICAL_SNAPSHOT") {
      red("HISTORICAL_SNAPSHOT_NOT_TYPED", "historical snapshot must self-identify as HISTORICAL_SNAPSHOT.");
    }
  }

  return {
    status: findings.some((f) => f.status === "red") ? "red" : "green",
    gate: "ACTIVE_HISTORICAL_TRUTH_TYPING_REQUIRED",
    findings,
  };
}
