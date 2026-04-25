import test from "node:test";
import assert from "node:assert/strict";
import { renderMarkdownReport } from "../../reports/markdown-report.js";
import type { AdmissibilityReport } from "../../src/types.js";

test("renders admissible report with boundary sentence", () => {
  const report: AdmissibilityReport = {
    run_id: "r",
    started_at: "now",
    org: "Verifrax",
    mode: "audit",
    accepted_graph_ref: "accepted.json",
    candidate_graph_ref: "candidate.json",
    verdict: "ADMISSIBLE",
    red_count: 0,
    yellow_count: 0,
    green_count: 1,
    quarantine_count: 0,
    findings: [],
    repair_plan_ref: "repair.json"
  };

  const rendered = renderMarkdownReport(report);

  assert.match(rendered, /ADMISSORIUM Admissibility Report/);
  assert.match(rendered, /ADMISSORIUM does not decide truth/);
  assert.match(rendered, /No findings/);
});

test("renders red findings in red section", () => {
  const report: AdmissibilityReport = {
    run_id: "r",
    started_at: "now",
    org: "Verifrax",
    mode: "audit",
    accepted_graph_ref: "accepted.json",
    candidate_graph_ref: "candidate.json",
    verdict: "INADMISSIBLE",
    red_count: 1,
    yellow_count: 0,
    green_count: 0,
    quarantine_count: 0,
    findings: [{
      finding_id: "RED-X",
      severity: "RED",
      repo: "Verifrax/X",
      surface: "README.md",
      invariant: "x",
      expected: "a",
      observed: "b",
      source_of_truth: "registry",
      autofix_allowed: false,
      recommended_action: "governance review"
    }],
    repair_plan_ref: "repair.json"
  };

  const rendered = renderMarkdownReport(report);

  assert.match(rendered, /## RED/);
  assert.match(rendered, /RED-X/);
  assert.match(rendered, /autofix_allowed: no/);
});
