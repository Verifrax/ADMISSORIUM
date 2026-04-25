import type { AdmissibilityReport } from "../src/types.js";

export type AcceptanceCriterionStatus = "PASS" | "FAIL";

export interface AcceptanceCriterion {
  id: string;
  title: string;
  status: AcceptanceCriterionStatus;
  evidence: string;
}

export interface AcceptanceReadinessInput {
  report: AdmissibilityReport;
  acceptedGraphCount: number;
  currentArtifactPaths: string[];
  implementedCapabilities: string[];
  truthMutationAllowed: boolean;
}

export interface AcceptanceReadinessArtifact {
  run_id: string;
  version: "0.1.0";
  ready: boolean;
  passed_count: number;
  failed_count: number;
  criteria: AcceptanceCriterion[];
}

function hasCapability(input: AcceptanceReadinessInput, capability: string): boolean {
  return input.implementedCapabilities.includes(capability);
}

function hasArtifact(input: AcceptanceReadinessInput, artifact: string): boolean {
  return input.currentArtifactPaths.includes(artifact);
}

function criterion(id: string, title: string, pass: boolean, evidence: string): AcceptanceCriterion {
  return {
    id,
    title,
    status: pass ? "PASS" : "FAIL",
    evidence
  };
}

export function buildAcceptanceReadinessArtifact(
  input: AcceptanceReadinessInput
): AcceptanceReadinessArtifact {
  const criteria: AcceptanceCriterion[] = [
    criterion(
      "V010-001",
      "Enumerates governed repositories",
      input.acceptedGraphCount > 0,
      `accepted_graph_count=${input.acceptedGraphCount}`
    ),
    criterion(
      "V010-002",
      "Builds candidate graph output",
      hasArtifact(input, "candidate-graph.json"),
      "candidate graph artifact must be emitted"
    ),
    criterion(
      "V010-003",
      "Emits machine-readable admissibility report",
      hasArtifact(input, "admissibility-report.json"),
      "JSON report artifact must be emitted"
    ),
    criterion(
      "V010-004",
      "Emits human-readable admissibility report",
      hasArtifact(input, "admissibility-report.md"),
      "Markdown report artifact must be emitted"
    ),
    criterion(
      "V010-005",
      "Emits repair plan artifact",
      hasArtifact(input, "repair-plan.json"),
      "repair plan artifact must be emitted"
    ),
    criterion(
      "V010-006",
      "Emits separated RED/YELLOW/GREEN/quarantine lists",
      ["red-list.json", "yellow-list.json", "green-list.json", "quarantine-list.json"].every((artifact) =>
        hasArtifact(input, artifact)
      ),
      "finding-list artifacts must be emitted"
    ),
    criterion(
      "V010-007",
      "Emits merge verdict artifact",
      hasArtifact(input, "merge-verdict.json"),
      "merge-verdict.json must be emitted"
    ),
    criterion(
      "V010-008",
      "Detects governed repository perimeter mismatch",
      hasCapability(input, "repo_perimeter_mismatch"),
      "repo perimeter invariant must be implemented"
    ),
    criterion(
      "V010-009",
      "Detects license registry and README license drift",
      hasCapability(input, "license_registry_consistency"),
      "license consistency invariant must be implemented"
    ),
    criterion(
      "V010-010",
      "Detects package registry source and count drift",
      hasCapability(input, "package_registry_consistency"),
      "package registry invariant must be implemented"
    ),
    criterion(
      "V010-011",
      "Detects repository class registry drift",
      hasCapability(input, "repo_class_registry_consistency"),
      "repo class registry invariant must be implemented"
    ),
    criterion(
      "V010-012",
      "Detects authority scope mismatch",
      hasCapability(input, "authority_scope_mismatch"),
      "authority scope invariant must be implemented"
    ),
    criterion(
      "V010-013",
      "Detects receipt identity collision",
      hasCapability(input, "receipt_identity_collision"),
      "receipt identity invariant must be implemented"
    ),
    criterion(
      "V010-014",
      "Maps admissibility to merge verdict and check conclusion",
      hasCapability(input, "merge_verdict_mapping"),
      "merge verdict and check conclusion mapping must be implemented"
    ),
    criterion(
      "V010-015",
      "Writes immutable local history snapshot manifest",
      hasCapability(input, "history_snapshot_manifest"),
      "history snapshot manifest must be implemented"
    ),
    criterion(
      "V010-016",
      "Refuses automatic sovereign truth mutation",
      input.truthMutationAllowed === false,
      `truth_mutation_allowed=${input.truthMutationAllowed}`
    )
  ];

  const passedCount = criteria.filter((item) => item.status === "PASS").length;
  const failedCount = criteria.length - passedCount;

  return {
    run_id: input.report.run_id,
    version: "0.1.0",
    ready: failedCount === 0,
    passed_count: passedCount,
    failed_count: failedCount,
    criteria
  };
}
