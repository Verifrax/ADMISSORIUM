import type { AdmissibilityReport } from "../src/types.js";
import { buildMergeVerdictArtifact, checkConclusionForMergeVerdict, type MergeVerdictArtifact } from "../reports/merge-verdict.js";

export type CheckRunConclusion = "success" | "failure" | "neutral";

function isMergeVerdictArtifact(value: AdmissibilityReport | MergeVerdictArtifact): value is MergeVerdictArtifact {
  return "merge_allowed" in value && "check_conclusion" in value;
}

export function checkRunConclusion(input: AdmissibilityReport | MergeVerdictArtifact): CheckRunConclusion {
  const artifact = isMergeVerdictArtifact(input) ? input : buildMergeVerdictArtifact(input);
  return checkConclusionForMergeVerdict(artifact.verdict);
}
