import type { AdmissibilityReport } from "../src/types.js";
import { buildMergeVerdictArtifact, type MergeVerdictArtifact } from "../reports/merge-verdict.js";
import {
  decideWrite,
  loadPermissionPolicy,
  loadProtectedPathsPolicy,
  type PermissionPolicy,
  type ProtectedPathsPolicy,
  type WriteDecision
} from "./permissions.js";

export type CheckRunPlanConclusion = "success" | "failure" | "neutral";

export interface CheckRunPlanInput {
  report: AdmissibilityReport;
  headSha: string;
  repositoryFullName: string;
  detailsUrl?: string;
  env?: NodeJS.ProcessEnv;
  permissionPolicy?: PermissionPolicy;
  protectedPathsPolicy?: ProtectedPathsPolicy;
}

export interface CheckRunPlan {
  dry_run: true;
  write_behavior: "NONE";
  name: "admissorium-admissibility";
  repository: string;
  head_sha: string;
  status: "completed";
  conclusion: CheckRunPlanConclusion;
  title: string;
  summary: string;
  text: string;
  merge_verdict: MergeVerdictArtifact;
  permission_decision: WriteDecision;
  details_url?: string;
}

function titleFor(artifact: MergeVerdictArtifact): string {
  if (artifact.verdict === "PASS") return "ADMISSORIUM admissibility passed";
  if (artifact.verdict === "BLOCKED_BY_CONSTITUTIONAL_DRIFT") return "ADMISSORIUM blocked inadmissible materialization";
  if (artifact.verdict === "QUARANTINED") return "ADMISSORIUM quarantined materialization";
  if (artifact.verdict === "REQUIRES_GOVERNANCE_REVIEW") return "ADMISSORIUM requires governance review";
  return "ADMISSORIUM projection repair required";
}

function summaryFor(report: AdmissibilityReport, artifact: MergeVerdictArtifact): string {
  return [
    `Admissibility verdict: ${report.verdict}`,
    `Merge verdict: ${artifact.verdict}`,
    `RED: ${report.red_count}`,
    `YELLOW: ${report.yellow_count}`,
    `QUARANTINED: ${report.quarantine_count}`,
    `Merge allowed: ${artifact.merge_allowed ? "true" : "false"}`
  ].join("\n");
}

function textFor(report: AdmissibilityReport, artifact: MergeVerdictArtifact): string {
  const findingLines = report.findings.length === 0
    ? ["No findings."]
    : report.findings.map((finding) =>
        `- ${finding.severity}: ${finding.finding_id} — ${finding.recommended_action}`
      );

  return [
    "ADMISSORIUM does not decide truth.",
    "ADMISSORIUM enforces admissibility of materialized surfaces against the accepted VERIFRAX object graph.",
    "",
    "## Counts",
    "",
    `- RED: ${report.red_count}`,
    `- YELLOW: ${report.yellow_count}`,
    `- GREEN: ${report.green_count}`,
    `- QUARANTINED: ${report.quarantine_count}`,
    "",
    "## Merge verdict",
    "",
    `- verdict: ${artifact.verdict}`,
    `- merge_allowed: ${artifact.merge_allowed}`,
    `- check_conclusion: ${artifact.check_conclusion}`,
    `- reason: ${artifact.reason}`,
    "",
    "## Findings",
    "",
    ...findingLines
  ].join("\n");
}

export function buildCheckRunPlan(input: CheckRunPlanInput): CheckRunPlan {
  const mergeVerdict = buildMergeVerdictArtifact(input.report);
  const permissionPolicy = input.permissionPolicy ?? loadPermissionPolicy();
  const protectedPathsPolicy = input.protectedPathsPolicy ?? loadProtectedPathsPolicy();

  const decisionInput = {
    mode: "block" as const,
    writeClass: "CHECK_RUN" as const,
    permissionPolicy,
    protectedPathsPolicy,
    ...(input.env ? { env: input.env } : {})
  };

  const permissionDecision = decideWrite(decisionInput);

  const plan: CheckRunPlan = {
    dry_run: true,
    write_behavior: "NONE",
    name: "admissorium-admissibility",
    repository: input.repositoryFullName,
    head_sha: input.headSha,
    status: "completed",
    conclusion: mergeVerdict.check_conclusion,
    title: titleFor(mergeVerdict),
    summary: summaryFor(input.report, mergeVerdict),
    text: textFor(input.report, mergeVerdict),
    merge_verdict: mergeVerdict,
    permission_decision: permissionDecision
  };

  return input.detailsUrl ? { ...plan, details_url: input.detailsUrl } : plan;
}
