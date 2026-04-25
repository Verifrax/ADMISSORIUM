import type { AdmissibilityReport, Finding } from "../src/types.js";

function findingLine(finding: Finding): string {
  return [
    `- ${finding.finding_id}`,
    `  - severity: ${finding.severity}`,
    `  - repo: ${finding.repo}`,
    `  - surface: ${finding.surface}`,
    `  - invariant: ${finding.invariant}`,
    `  - autofix_allowed: ${finding.autofix_allowed ? "yes" : "no"}`,
    `  - action: ${finding.recommended_action}`
  ].join("\n");
}

export function renderMarkdownReport(report: AdmissibilityReport): string {
  const red = report.findings.filter((finding) => finding.severity === "RED");
  const yellow = report.findings.filter((finding) => finding.severity === "YELLOW");
  const green = report.findings.filter((finding) => finding.severity === "GREEN");

  const lines = [
    "# ADMISSORIUM Admissibility Report",
    "",
    `Run: ${report.run_id}`,
    `Started: ${report.started_at}`,
    `Organization: ${report.org}`,
    `Mode: ${report.mode}`,
    `Verdict: ${report.verdict}`,
    "",
    "## Counts",
    "",
    `- RED: ${report.red_count}`,
    `- YELLOW: ${report.yellow_count}`,
    `- GREEN: ${report.green_count}`,
    `- QUARANTINED: ${report.quarantine_count}`,
    "",
    "## Boundary",
    "",
    "ADMISSORIUM does not decide truth. ADMISSORIUM enforces admissibility of materialized surfaces against the accepted VERIFRAX object graph.",
    "",
    "## RED",
    "",
    red.length > 0 ? red.map(findingLine).join("\n") : "None.",
    "",
    "## YELLOW",
    "",
    yellow.length > 0 ? yellow.map(findingLine).join("\n") : "None.",
    "",
    "## GREEN",
    "",
    green.length > 0 ? green.map(findingLine).join("\n") : report.findings.length === 0 ? "No findings. Current audit is admissible." : "No explicit green findings.",
    "",
    "## References",
    "",
    `- accepted graph: ${report.accepted_graph_ref}`,
    `- candidate graph: ${report.candidate_graph_ref}`,
    `- repair plan: ${report.repair_plan_ref}`,
    ""
  ];

  return `${lines.join("\n")}\n`;
}
