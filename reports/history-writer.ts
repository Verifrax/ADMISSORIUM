import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AdmissibilityReport } from "../src/types.js";

export interface HistorySnapshotArtifacts {
  acceptedGraph: unknown;
  candidateGraph: unknown;
  repairPlan: unknown;
  markdownReport: string;
  redList: unknown;
  yellowList: unknown;
  greenList: unknown;
  quarantineList: unknown;
  mergeVerdict: unknown;
}

interface ManifestEntry {
  path: string;
  sha256: string;
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function writeArtifact(dir: string, path: string, content: string): ManifestEntry {
  const fullPath = join(dir, path);
  writeFileSync(fullPath, content);
  return {
    path,
    sha256: sha256(content)
  };
}

export function writeHistorySnapshot(
  baseDir: string,
  report: AdmissibilityReport,
  artifacts: HistorySnapshotArtifacts
): string {
  const historyDir = join(baseDir, "reports", "history", report.run_id);

  if (existsSync(historyDir)) {
    throw new Error(`History snapshot already exists: ${historyDir}`);
  }

  mkdirSync(historyDir, { recursive: true });

  const reportJson = `${JSON.stringify(report, null, 2)}\n`;
  const acceptedGraphJson = `${JSON.stringify(artifacts.acceptedGraph, null, 2)}\n`;
  const candidateGraphJson = `${JSON.stringify(artifacts.candidateGraph, null, 2)}\n`;
  const repairPlanJson = `${JSON.stringify(artifacts.repairPlan, null, 2)}\n`;
  const redListJson = `${JSON.stringify(artifacts.redList, null, 2)}\n`;
  const yellowListJson = `${JSON.stringify(artifacts.yellowList, null, 2)}\n`;
  const greenListJson = `${JSON.stringify(artifacts.greenList, null, 2)}\n`;
  const quarantineListJson = `${JSON.stringify(artifacts.quarantineList, null, 2)}\n`;
  const mergeVerdictJson = `${JSON.stringify(artifacts.mergeVerdict, null, 2)}\n`;

  const files = [
    writeArtifact(historyDir, "admissibility-report.json", reportJson),
    writeArtifact(historyDir, "admissibility-report.md", artifacts.markdownReport),
    writeArtifact(historyDir, "accepted-graph.json", acceptedGraphJson),
    writeArtifact(historyDir, "candidate-graph.json", candidateGraphJson),
    writeArtifact(historyDir, "repair-plan.json", repairPlanJson),
    writeArtifact(historyDir, "red-list.json", redListJson),
    writeArtifact(historyDir, "yellow-list.json", yellowListJson),
    writeArtifact(historyDir, "green-list.json", greenListJson),
    writeArtifact(historyDir, "quarantine-list.json", quarantineListJson),
    writeArtifact(historyDir, "merge-verdict.json", mergeVerdictJson)
  ];

  const manifest = {
    run_id: report.run_id,
    started_at: report.started_at,
    verdict: report.verdict,
    immutable_local_snapshot: true,
    files
  };

  writeArtifact(historyDir, "manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);

  return historyDir;
}
