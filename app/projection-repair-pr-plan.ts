import type { AdmissibilityReport, Finding } from "../src/types.js";

export interface ProjectionRepairPrPlanInput {
  report: AdmissibilityReport;
  repositoryFullName: string;
  baseBranch?: string;
  branchPrefix?: string;
  labels?: string[];
}

export interface ProjectionRepairPrPlanChange {
  finding_id: string;
  repo: string;
  surface: string;
  invariant: string;
  expected: string;
  observed: string;
  recommended_action: string;
}

export interface ProjectionRepairPrPlan {
  dry_run: true;
  write_behavior: "NONE";
  required: boolean;
  repository: string;
  base_branch: string;
  head_branch: string;
  title: string;
  body: string;
  labels: string[];
  change_count: number;
  blocked_count: number;
  changes: ProjectionRepairPrPlanChange[];
  blocked_findings: ProjectionRepairPrPlanChange[];
  run_id: string;
}

const PROTECTED_SURFACE_PREFIXES = [
  "law/",
  "freeze/",
  "epochs/current/",
  "current/",
  "authorities/current/",
  "receipts/current/",
  "verification/results/current/",
  "recognitions/current/",
  "claims/current/",
  "continuity/current/",
  "transfer/current/"
];

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "projection-repair";
}

function isProtectedSurface(surface: string): boolean {
  return PROTECTED_SURFACE_PREFIXES.some((prefix) => surface === prefix.slice(0, -1) || surface.startsWith(prefix));
}

function isProjectionRepairFinding(finding: Finding): boolean {
  return finding.severity === "YELLOW" && finding.autofix_allowed === true;
}

function stringifyEvidence(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function toChange(finding: Finding): ProjectionRepairPrPlanChange {
  return {
    finding_id: finding.finding_id,
    repo: finding.repo,
    surface: finding.surface,
    invariant: finding.invariant,
    expected: stringifyEvidence(finding.expected),
    observed: stringifyEvidence(finding.observed),
    recommended_action: finding.recommended_action
  };
}

function renderChange(change: ProjectionRepairPrPlanChange): string {
  return [
    `- finding_id: ${change.finding_id}`,
    `  repo: ${change.repo}`,
    `  surface: ${change.surface}`,
    `  invariant: ${change.invariant}`,
    `  expected: ${change.expected}`,
    `  observed: ${change.observed}`,
    `  recommended_action: ${change.recommended_action}`
  ].join("\n");
}

export function buildProjectionRepairPrPlan(input: ProjectionRepairPrPlanInput): ProjectionRepairPrPlan {
  const baseBranch = input.baseBranch ?? "main";
  const branchPrefix = input.branchPrefix ?? "admissorium/projection-repair";
  const labels = input.labels ?? ["admissorium", "projection-repair"];

  const projectionRepairFindings = input.report.findings.filter(isProjectionRepairFinding);
  const changes = projectionRepairFindings
    .filter((finding) => !isProtectedSurface(finding.surface))
    .map(toChange);

  const blockedFindings = projectionRepairFindings
    .filter((finding) => isProtectedSurface(finding.surface))
    .map(toChange);

  const required = changes.length > 0;
  const headBranch = `${branchPrefix}-${slug(input.report.run_id)}`;

  const title = required
    ? `ADMISSORIUM projection repair: ${input.report.run_id}`
    : `ADMISSORIUM projection repair not required: ${input.report.run_id}`;

  const body = [
    "ADMISSORIUM does not decide truth.",
    "ADMISSORIUM enforces admissibility of materialized surfaces against the accepted VERIFRAX object graph.",
    "",
    "## Dry-run boundary",
    "",
    "This is a deterministic projection repair pull request plan.",
    "No GitHub pull request is created by this layer.",
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
    "",
    "## Planned projection repairs",
    "",
    changes.length === 0 ? "None." : changes.map(renderChange).join("\n\n"),
    "",
    "## Blocked protected-surface findings",
    "",
    blockedFindings.length === 0 ? "None." : blockedFindings.map(renderChange).join("\n\n")
  ].join("\n");

  return {
    dry_run: true,
    write_behavior: "NONE",
    required,
    repository: input.repositoryFullName,
    base_branch: baseBranch,
    head_branch: headBranch,
    title,
    body,
    labels,
    change_count: changes.length,
    blocked_count: blockedFindings.length,
    changes,
    blocked_findings: blockedFindings,
    run_id: input.report.run_id
  };
}
