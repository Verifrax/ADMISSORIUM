import type { AdmissibilityReport, Finding } from "../src/types.js";

export interface QuarantineIssuePlanInput {
  report: AdmissibilityReport;
  repositoryFullName: string;
  labels?: string[];
}

export interface QuarantineIssuePlan {
  dry_run: true;
  write_behavior: "NONE";
  required: boolean;
  repository: string;
  title: string;
  body: string;
  labels: string[];
  finding_count: number;
  run_id: string;
}

function findingLine(finding: Finding): string {
  return [
    `- finding_id: ${finding.finding_id}`,
    `  severity: ${finding.severity}`,
    `  repo: ${finding.repo}`,
    `  surface: ${finding.surface}`,
    `  invariant: ${finding.invariant}`,
    `  expected: ${finding.expected}`,
    `  observed: ${finding.observed}`,
    `  source_of_truth: ${finding.source_of_truth}`,
    `  autofix_allowed: ${finding.autofix_allowed ? "true" : "false"}`,
    `  recommended_action: ${finding.recommended_action}`
  ].join("\n");
}

function quarantineRelevantFindings(report: AdmissibilityReport): Finding[] {
  if (report.quarantine_count > 0) {
    return report.findings;
  }

  return report.findings.filter((finding) =>
    finding.finding_id.toLowerCase().includes("quarantine") ||
    finding.recommended_action.toLowerCase().includes("quarantine")
  );
}

export function buildQuarantineIssuePlan(input: QuarantineIssuePlanInput): QuarantineIssuePlan {
  const findings = quarantineRelevantFindings(input.report);
  const required = input.report.quarantine_count > 0 || findings.length > 0;
  const labels = input.labels ?? [
    "admissorium",
    "quarantine",
    "governance-review"
  ];

  const title = required
    ? `ADMISSORIUM quarantine review required: ${input.report.run_id}`
    : `ADMISSORIUM quarantine review not required: ${input.report.run_id}`;

  const body = [
    "ADMISSORIUM does not decide truth.",
    "ADMISSORIUM enforces admissibility of materialized surfaces against the accepted VERIFRAX object graph.",
    "",
    "## Dry-run boundary",
    "",
    "This is a deterministic quarantine issue plan.",
    "No GitHub issue is created by this layer.",
    "No branch is created.",
    "No file is mutated.",
    "No truth object is rewritten.",
    "",
    "## Run",
    "",
    `- run_id: ${input.report.run_id}`,
    `- started_at: ${input.report.started_at}`,
    `- repository: ${input.repositoryFullName}`,
    `- admissibility_verdict: ${input.report.verdict}`,
    `- red_count: ${input.report.red_count}`,
    `- yellow_count: ${input.report.yellow_count}`,
    `- quarantine_count: ${input.report.quarantine_count}`,
    "",
    "## Quarantine findings",
    "",
    findings.length === 0 ? "None." : findings.map(findingLine).join("\n\n")
  ].join("\n");

  return {
    dry_run: true,
    write_behavior: "NONE",
    required,
    repository: input.repositoryFullName,
    title,
    body,
    labels,
    finding_count: findings.length,
    run_id: input.report.run_id
  };
}
