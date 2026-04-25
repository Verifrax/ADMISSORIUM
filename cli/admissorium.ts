#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { buildAcceptedGraph } from "../graph/builders/accepted-graph-builder.js";
import { discoverLocalRepos } from "../graph/builders/live-inventory-builder.js";
import { repoPerimeterInvariant } from "../invariants/repo-perimeter.js";
import { compileRepairPlan } from "../compilers/repair-plan-compiler.js";
import { classifyRed } from "../classifiers/classify-red.js";
import { classifyYellow } from "../classifiers/classify-yellow.js";
import { GOVERNED_REPOS_35 } from "../src/constants.js";
import type { AdmissibilityReport, Finding } from "../src/types.js";

function arg(name: string, fallback: string): string {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

function mode(): AdmissibilityReport["mode"] {
  const raw = process.argv[2] ?? "audit";
  if (["audit", "repair-projection", "candidate-registry", "block", "quarantine"].includes(raw)) {
    return raw as AdmissibilityReport["mode"];
  }
  return "audit";
}

function verdict(findings: Finding[]): AdmissibilityReport["verdict"] {
  if (findings.some((finding) => finding.severity === "RED")) return "INADMISSIBLE";
  if (findings.some((finding) => finding.severity === "YELLOW")) return "ADMISSIBLE_AS_PROJECTION_REPAIR";
  return "ADMISSIBLE";
}

function main(): void {
  const org = arg("--org", "Verifrax");
  const root = arg("--root", "../");
  const started = new Date().toISOString();
  const runId = `admissorium-${started.replace(/[:.]/g, "-")}`;
  const acceptedGraph = buildAcceptedGraph();
  const liveInventory = discoverLocalRepos(root, org);
  const findings: Finding[] = [];

  const singleRepositoryCiMode = liveInventory.length === 0;

  if (!singleRepositoryCiMode) {
    findings.push(
      ...repoPerimeterInvariant(
        [...GOVERNED_REPOS_35],
        liveInventory.map((entry) => entry.repo)
      )
    );
  }

  const candidateInventory = singleRepositoryCiMode
    ? acceptedGraph.map((node) => ({
        repo: node.id,
        path: "accepted-graph",
        has_git: false,
        has_readme: false,
        has_license: false,
        has_package_json: false,
        has_surface_host: false
      }))
    : liveInventory;

  if (acceptedGraph.length !== 35) {
    findings.push({
      finding_id: "RED-GOVERNED-REPO-COUNT",
      severity: "RED",
      repo: "Verifrax/.github",
      surface: ".github/governance/GOVERNED_REPOS.txt",
      invariant: "no_orphan_surfaces",
      expected: 35,
      observed: acceptedGraph.length,
      source_of_truth: ".github/governance/GOVERNED_REPOS.txt",
      autofix_allowed: false,
      recommended_action: "Align governed repository registry through governance review."
    });
  }

  const red = classifyRed(findings);
  const yellow = classifyYellow(findings);

  const report: AdmissibilityReport = {
    run_id: runId,
    started_at: started,
    org,
    mode: mode(),
    accepted_graph_ref: "reports/current/accepted-graph.json",
    candidate_graph_ref: "reports/current/candidate-graph.json",
    verdict: verdict(findings),
    red_count: red.length,
    yellow_count: yellow.length,
    green_count: findings.length === 0 ? 1 : 0,
    quarantine_count: findings.filter((finding) =>
      finding.recommended_action.toLowerCase().includes("quarantine")
    ).length,
    findings,
    repair_plan_ref: "reports/current/repair-plan.json"
  };

  mkdirSync("reports/current", { recursive: true });
  writeFileSync("reports/current/accepted-graph.json", JSON.stringify(acceptedGraph, null, 2) + "\n");
  writeFileSync("reports/current/candidate-graph.json", JSON.stringify(candidateInventory, null, 2) + "\n");
  writeFileSync("reports/current/repair-plan.json", JSON.stringify(compileRepairPlan(findings), null, 2) + "\n");
  writeFileSync("reports/current/admissibility-report.json", JSON.stringify(report, null, 2) + "\n");

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.red_count > 0 ? 2 : report.yellow_count > 0 ? 1 : 0);
}

main();
