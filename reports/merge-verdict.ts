import type { AdmissibilityReport } from "../src/types.js";

export type MergeVerdict =
  | "PASS"
  | "PASS_WITH_PROJECTION_REPAIR"
  | "REQUIRES_GOVERNANCE_REVIEW"
  | "BLOCKED_BY_CONSTITUTIONAL_DRIFT"
  | "QUARANTINED";

export interface MergeVerdictArtifact {
  run_id: string;
  verdict: MergeVerdict;
  admissibility_verdict: AdmissibilityReport["verdict"];
  red_count: number;
  yellow_count: number;
  quarantine_count: number;
  merge_allowed: boolean;
  check_conclusion: "success" | "failure" | "neutral";
  reason: string;
}

export function mergeVerdictForReport(report: AdmissibilityReport): MergeVerdict {
  if (report.verdict === "QUARANTINED" || report.quarantine_count > 0) {
    return "QUARANTINED";
  }

  if (report.verdict === "INADMISSIBLE" || report.red_count > 0) {
    return "BLOCKED_BY_CONSTITUTIONAL_DRIFT";
  }

  if (report.verdict === "REQUIRES_ACCEPTANCE_ACT") {
    return "REQUIRES_GOVERNANCE_REVIEW";
  }

  if (report.verdict === "ADMISSIBLE_AS_PROJECTION_REPAIR" || report.yellow_count > 0) {
    return "PASS_WITH_PROJECTION_REPAIR";
  }

  return "PASS";
}

export function checkConclusionForMergeVerdict(
  verdict: MergeVerdict
): "success" | "failure" | "neutral" {
  switch (verdict) {
    case "PASS":
    case "PASS_WITH_PROJECTION_REPAIR":
      return "success";
    case "REQUIRES_GOVERNANCE_REVIEW":
      return "neutral";
    case "BLOCKED_BY_CONSTITUTIONAL_DRIFT":
    case "QUARANTINED":
      return "failure";
  }
}

function reasonForVerdict(verdict: MergeVerdict): string {
  switch (verdict) {
    case "PASS":
      return "Candidate materialization is admissible against accepted graph.";
    case "PASS_WITH_PROJECTION_REPAIR":
      return "Candidate materialization is admissible as projection repair and does not require truth mutation.";
    case "REQUIRES_GOVERNANCE_REVIEW":
      return "Candidate materialization changes registry or truth-adjacent material and requires governed review.";
    case "BLOCKED_BY_CONSTITUTIONAL_DRIFT":
      return "Candidate materialization introduces or preserves constitutional drift.";
    case "QUARANTINED":
      return "Candidate materialization contains quarantined or quarantine-requiring surface.";
  }
}

export function buildMergeVerdictArtifact(report: AdmissibilityReport): MergeVerdictArtifact {
  const verdict = mergeVerdictForReport(report);

  return {
    run_id: report.run_id,
    verdict,
    admissibility_verdict: report.verdict,
    red_count: report.red_count,
    yellow_count: report.yellow_count,
    quarantine_count: report.quarantine_count,
    merge_allowed: verdict === "PASS" || verdict === "PASS_WITH_PROJECTION_REPAIR",
    check_conclusion: checkConclusionForMergeVerdict(verdict),
    reason: reasonForVerdict(verdict)
  };
}
