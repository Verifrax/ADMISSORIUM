import test from "node:test";
import assert from "node:assert/strict";
import { buildFindingListArtifacts } from "../../reports/finding-lists.js";
import type { AdmissibilityReport } from "../../src/types.js";

test("builds red yellow green and quarantine list artifacts", () => {
  const report: AdmissibilityReport = {
    run_id: "r",
    started_at: "now",
    org: "Verifrax",
    mode: "audit",
    accepted_graph_ref: "accepted.json",
    candidate_graph_ref: "candidate.json",
    verdict: "INADMISSIBLE",
    red_count: 1,
    yellow_count: 1,
    green_count: 0,
    quarantine_count: 1,
    findings: [
      {
        finding_id: "RED-X",
        severity: "RED",
        repo: "Verifrax/X",
        surface: "x",
        invariant: "x",
        expected: "a",
        observed: "b",
        source_of_truth: "registry",
        autofix_allowed: false,
        recommended_action: "quarantine contradictory surface"
      },
      {
        finding_id: "YELLOW-Y",
        severity: "YELLOW",
        repo: "Verifrax/Y",
        surface: "y",
        invariant: "y",
        expected: "a",
        observed: "b",
        source_of_truth: "registry",
        autofix_allowed: true,
        recommended_action: "repair projection"
      }
    ],
    repair_plan_ref: "repair.json"
  };

  const lists = buildFindingListArtifacts(report);

  assert.equal(lists.redList.count, 1);
  assert.equal(lists.yellowList.count, 1);
  assert.equal(lists.greenList.count, 0);
  assert.equal(lists.quarantineList.count, 1);
  assert.equal(lists.quarantineList.findings[0]?.finding_id, "RED-X");
});
