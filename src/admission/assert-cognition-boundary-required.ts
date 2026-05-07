export type CognitionBoundaryRequiredStatus = "green" | "yellow" | "red";

export interface CognitionBoundaryRequiredFinding {
  status: CognitionBoundaryRequiredStatus;
  code: string;
  message: string;
}

export interface CognitionBoundaryRequiredReport {
  status: CognitionBoundaryRequiredStatus;
  gate: "COGNITION_BOUNDARY_REQUIRED";
  findings: CognitionBoundaryRequiredFinding[];
}

export interface CognitionBoundaryRequiredInput {
  cognitionBoundary?: Record<string, unknown>;
  cognitionBoundaryIndex?: Record<string, unknown>;
  projection?: Record<string, unknown>;
  statusSurface?: Record<string, unknown>;
  mergeGateResult?: Record<string, unknown>;
}

const REQUIRED_ALLOWED = [
  "CANDIDATE_ANALYSIS",
  "AMBIGUITY_COMPRESSION",
  "TOPOLOGY_EXPLANATION",
  "CONTRADICTION_SUMMARY",
  "ROUTE_PROPOSAL",
  "PROJECTION_DRAFT",
  "BOUNDARY_RISK_REPORT",
  "RECOGNITION_READINESS_ASSESSMENT",
  "RECOURSE_PREREQUISITE_ASSESSMENT",
];

const REQUIRED_FORBIDDEN = [
  "LAW_OBJECT",
  "ACCEPTED_EPOCH_OBJECT",
  "AUTHORITY_OBJECT",
  "EXECUTION_RECEIPT",
  "VERIFICATION_VERDICT_OF_RECORD",
  "RECOGNITION_OBJECT_OF_RECORD",
  "RECOURSE_OBJECT_OF_RECORD",
  "MERGE_GATE_RESULT",
];

const REQUIRED_BOUNDARY_TRUE = [
  "tachyrium_may_make_stack_machine_legible",
  "tachyrium_may_not_let_machines_skip_stack",
  "tachyrium_does_not_author_law",
  "tachyrium_does_not_accept_state",
  "tachyrium_does_not_issue_authority",
  "tachyrium_does_not_execute_governed_actions",
  "tachyrium_does_not_verify_as_record",
  "tachyrium_does_not_recognize_terminal_truth",
  "tachyrium_does_not_assign_recourse",
  "tachyrium_does_not_emit_merge_gate_results",
];

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
}

function hasOwn(obj: Record<string, unknown> | undefined, key: string): boolean {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}

function objectArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
    : [];
}

function claimsSovereignCognition(value: Record<string, unknown> | undefined): boolean {
  if (!value) return false;

  return value.object_type === "CognitionBoundary" ||
    value.object_id === "cognition-boundary-0001" ||
    value.status === "ACTIVE_CURRENT_BOUNDARY" ||
    value.truth_kind === "ACTIVE_TRUTH" ||
    value.truth_source === true ||
    value.is_truth_source === true ||
    hasOwn(value, "cognition_boundary_id") ||
    hasOwn(value, "cognitionBoundary") ||
    hasOwn(value, "cognition_boundary");
}

export function assertCognitionBoundaryRequired(
  input: CognitionBoundaryRequiredInput,
): CognitionBoundaryRequiredReport {
  const findings: CognitionBoundaryRequiredFinding[] = [];
  const red = (code: string, message: string) => findings.push({ status: "red", code, message });
  const yellow = (code: string, message: string) => findings.push({ status: "yellow", code, message });

  const boundary = input.cognitionBoundary;

  if (!boundary) {
    red("COGNITION_BOUNDARY_MISSING", "cognition-boundary-0001 is absent.");
  } else {
    if (boundary.object_type !== "CognitionBoundary") {
      red("COGNITION_BOUNDARY_WRONG_OBJECT_TYPE", "cognition boundary object_type must be CognitionBoundary.");
    }

    if (boundary.object_id !== "cognition-boundary-0001") {
      red("COGNITION_BOUNDARY_SUBSTITUTION", "cognition boundary object id must be cognition-boundary-0001.");
    }

    if (boundary.repo !== "Verifrax/TACHYRIUM") {
      red("COGNITION_BOUNDARY_WRONG_REPO", "cognition boundary must belong to Verifrax/TACHYRIUM.");
    }

    if (boundary.status !== "ACTIVE_CURRENT_BOUNDARY") {
      red("COGNITION_BOUNDARY_NOT_ACTIVE", "cognition boundary must be ACTIVE_CURRENT_BOUNDARY.");
    }

    const allowed = stringArray(boundary.allowed_output_classes);
    for (const outputClass of REQUIRED_ALLOWED) {
      if (!allowed.includes(outputClass)) {
        yellow("COGNITION_ALLOWED_OUTPUT_CLASS_MISSING", `cognition boundary should expose ${outputClass}.`);
      }
    }

    const forbidden = stringArray(boundary.forbidden_output_classes);
    for (const outputClass of REQUIRED_FORBIDDEN) {
      if (!forbidden.includes(outputClass)) {
        red("COGNITION_FORBIDDEN_OUTPUT_CLASS_MISSING", `cognition boundary must forbid ${outputClass}.`);
      }
    }

    const boundaryFlags = typeof boundary.boundary === "object" && boundary.boundary !== null
      ? boundary.boundary as Record<string, unknown>
      : undefined;

    if (!boundaryFlags) {
      red("COGNITION_BOUNDARY_FLAGS_MISSING", "cognition boundary must expose boundary flags.");
    } else {
      for (const flag of REQUIRED_BOUNDARY_TRUE) {
        if (boundaryFlags[flag] !== true) {
          red("COGNITION_BOUNDARY_FLAG_NOT_TRUE", `cognition boundary must set ${flag}=true.`);
        }
      }
    }

    const inputs = stringArray(boundary.minimum_machine_deference_inputs);
    if (inputs.length < 6) {
      red("COGNITION_DEFERENCE_INPUTS_INCOMPLETE", "cognition boundary must require machine deference inputs before sovereign interpretation.");
    }

    if (boundary.anti_overread_rule !== "Cognition may expose missing public objects; cognition may not socially patch those absences.") {
      red("COGNITION_ANTI_OVERREAD_RULE_DRIFT", "cognition boundary must preserve the anti-overread rule.");
    }
  }

  const idx = input.cognitionBoundaryIndex;
  if (!idx || idx.current !== "cognition-boundary-0001") {
    red("COGNITION_BOUNDARY_INDEX_DRIFT", "cognition boundary index must point to cognition-boundary-0001.");
  } else {
    const objects = objectArray(idx.objects);
    if (!objects.some((entry) =>
      entry.object_id === "cognition-boundary-0001" &&
      entry.path === "cognition/current/cognition-boundary-0001.json"
    )) {
      red("COGNITION_BOUNDARY_INDEX_PATH_DRIFT", "cognition boundary index must bind cognition/current/cognition-boundary-0001.json.");
    }
  }

  if (claimsSovereignCognition(input.projection)) {
    red("PROJECTION_ADDED_COGNITION_BOUNDARY", "projection surfaces may not add or substitute cognition boundary truth.");
  }

  if (claimsSovereignCognition(input.statusSurface)) {
    red("STATUS_SURFACE_CLAIMS_COGNITION_TRUTH", "status surfaces may not claim cognition boundary truth-source status.");
  }

  if (input.mergeGateResult) {
    const source = input.mergeGateResult.source ?? input.mergeGateResult.producer ?? input.mergeGateResult.author;
    if (source === "TACHYRIUM" || source === "Verifrax/TACHYRIUM") {
      red("TACHYRIUM_MERGE_GATE_OVERCLAIM", "TACHYRIUM may not emit merge-gate results.");
    }
  }

  const status: CognitionBoundaryRequiredStatus = findings.some((f) => f.status === "red")
    ? "red"
    : findings.some((f) => f.status === "yellow")
      ? "yellow"
      : "green";

  return {
    status,
    gate: "COGNITION_BOUNDARY_REQUIRED",
    findings,
  };
}
