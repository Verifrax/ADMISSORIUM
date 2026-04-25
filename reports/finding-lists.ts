import type { AdmissibilityReport, Finding, Severity } from "../src/types.js";

export interface FindingListArtifact {
  run_id: string;
  severity: Severity | "QUARANTINED";
  count: number;
  findings: Finding[];
}

export interface FindingListArtifacts {
  redList: FindingListArtifact;
  yellowList: FindingListArtifact;
  greenList: FindingListArtifact;
  quarantineList: FindingListArtifact;
}

function findingsBySeverity(report: AdmissibilityReport, severity: Severity): Finding[] {
  return report.findings.filter((finding) => finding.severity === severity);
}

function quarantineFindings(report: AdmissibilityReport): Finding[] {
  return report.findings.filter((finding) =>
    finding.finding_id.includes("QUARANTINE") ||
    finding.recommended_action.toLowerCase().includes("quarantine")
  );
}

function artifact(
  report: AdmissibilityReport,
  severity: Severity | "QUARANTINED",
  count: number,
  findings: Finding[]
): FindingListArtifact {
  return {
    run_id: report.run_id,
    severity,
    count,
    findings
  };
}

export function buildFindingListArtifacts(report: AdmissibilityReport): FindingListArtifacts {
  const red = findingsBySeverity(report, "RED");
  const yellow = findingsBySeverity(report, "YELLOW");
  const green = findingsBySeverity(report, "GREEN");
  const quarantined = quarantineFindings(report);

  return {
    redList: artifact(report, "RED", report.red_count, red),
    yellowList: artifact(report, "YELLOW", report.yellow_count, yellow),
    greenList: artifact(report, "GREEN", report.green_count, green),
    quarantineList: artifact(report, "QUARANTINED", report.quarantine_count, quarantined)
  };
}
