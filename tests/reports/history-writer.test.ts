import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import assert from "node:assert/strict";
import { writeHistorySnapshot } from "../../reports/history-writer.js";
import type { AdmissibilityReport } from "../../src/types.js";

function report(runId: string): AdmissibilityReport {
  return {
    run_id: runId,
    started_at: "2026-04-25T00:00:00.000Z",
    org: "Verifrax",
    mode: "audit",
    accepted_graph_ref: "reports/current/accepted-graph.json",
    candidate_graph_ref: "reports/current/candidate-graph.json",
    verdict: "ADMISSIBLE",
    red_count: 0,
    yellow_count: 0,
    green_count: 1,
    quarantine_count: 0,
    findings: [],
    repair_plan_ref: "reports/current/repair-plan.json"
  };
}

function artifacts() {
  return {
    acceptedGraph: [{ id: "Verifrax/ADMISSORIUM" }],
    candidateGraph: [],
    repairPlan: [],
    markdownReport: "# Report\n",
    redList: { findings: [] },
    yellowList: { findings: [] },
    greenList: { findings: [] },
    quarantineList: { findings: [] },
    mergeVerdict: { verdict: "PASS" }
  };
}

test("writes immutable local history snapshot artifacts", () => {
  const root = mkdtempSync(join(tmpdir(), "admissorium-history-"));
  try {
    const dir = writeHistorySnapshot(root, report("admissorium-test-run"), artifacts());

    for (const file of [
      "admissibility-report.json",
      "admissibility-report.md",
      "accepted-graph.json",
      "candidate-graph.json",
      "repair-plan.json",
      "red-list.json",
      "yellow-list.json",
      "green-list.json",
      "quarantine-list.json",
      "merge-verdict.json",
      "manifest.json"
    ]) {
      assert.equal(existsSync(join(dir, file)), true);
    }

    const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")) as {
      immutable_local_snapshot: boolean;
      files: Array<{ path: string; sha256: string }>;
    };

    assert.equal(manifest.immutable_local_snapshot, true);
    assert.equal(manifest.files.length, 10);
    assert.equal(manifest.files.every((file) => file.sha256.length === 64), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("refuses to overwrite an existing history snapshot", () => {
  const root = mkdtempSync(join(tmpdir(), "admissorium-history-"));
  try {
    const r = report("admissorium-test-run");

    writeHistorySnapshot(root, r, artifacts());

    assert.throws(() => writeHistorySnapshot(root, r, artifacts()), /already exists/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
