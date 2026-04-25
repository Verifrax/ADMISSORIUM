#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildAcceptedGraph } from "../graph/builders/accepted-graph-builder.js";
import { discoverLocalRepos } from "../graph/builders/live-inventory-builder.js";
import { loadGovernedRepos } from "../graph/loaders/governed-repos-loader.js";
import { loadLicenseRegistry } from "../graph/loaders/licenses-loader.js";
import { loadPackageRegistry } from "../graph/loaders/packages-loader.js";
import { loadRepoClassRegistry } from "../graph/loaders/repo-classes-loader.js";
import { packageRegistryInvariant, type ObservedPackage } from "../invariants/package-registry.js";
import { repoClassRegistryInvariant } from "../invariants/repo-class-registry.js";
import { repoPerimeterInvariant } from "../invariants/repo-perimeter.js";
import { licenseConsistencyInvariant } from "../invariants/license-consistency.js";
import { compileRepairPlan } from "../compilers/repair-plan-compiler.js";
import { renderMarkdownReport } from "../reports/markdown-report.js";
import { writeHistorySnapshot } from "../reports/history-writer.js";
import { buildFindingListArtifacts } from "../reports/finding-lists.js";
import { buildMergeVerdictArtifact } from "../reports/merge-verdict.js";
import { buildAcceptanceReadinessArtifact } from "../reports/acceptance-readiness.js";
import { buildActuatorReadiness } from "../reports/actuator-readiness.js";
import { classifyRed } from "../classifiers/classify-red.js";
import { classifyYellow } from "../classifiers/classify-yellow.js";
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

function readText(path: string): string | null {
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8");
}

function main(): void {
  const org = arg("--org", "Verifrax");
  const root = arg("--root", "../");
  const started = new Date().toISOString();
  const runId = `admissorium-${started.replace(/[:.]/g, "-")}`;

  const governedRepos = loadGovernedRepos(root);
  const licenseRegistry = loadLicenseRegistry(root);
  const packageRegistry = loadPackageRegistry(root);
  const repoClassRegistry = loadRepoClassRegistry(root);
  const acceptedGraph = buildAcceptedGraph(governedRepos.repos, governedRepos.source);
  const liveInventory = discoverLocalRepos(root, org);
  const findings: Finding[] = [];

  const singleRepositoryCiMode = liveInventory.length === 0;

  if (!singleRepositoryCiMode) {
    findings.push(
      ...repoPerimeterInvariant(
        governedRepos.repos,
        liveInventory.map((entry) => entry.repo)
      )
    );

    if (repoClassRegistry.present) {
      findings.push(
        ...repoClassRegistryInvariant(
          governedRepos.repos,
          repoClassRegistry.entries,
          repoClassRegistry.source
        )
      );
    }

    const licensesByRepo = new Map(licenseRegistry.entries.map((entry) => [entry.repo, entry]));

    for (const entry of liveInventory) {
      const expected = licensesByRepo.get(entry.repo);
      if (!expected) continue;

      findings.push(
        ...licenseConsistencyInvariant(
          entry.repo,
          readText(join(entry.path, "LICENSE")),
          readText(join(entry.path, "README.md")),
          expected.license,
          licenseRegistry.source
        )
      );
    }

    if (packageRegistry.present) {
      const observedPackages: ObservedPackage[] = [];

      for (const entry of liveInventory) {
        const packageJsonPath = join(entry.path, "package.json");
        if (!existsSync(packageJsonPath)) continue;

        const parsed = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { name?: unknown };
        if (typeof parsed.name !== "string" || parsed.name.length === 0) continue;

        observedPackages.push({
          repo: entry.repo,
          name: parsed.name,
          path: `${entry.repo}:package.json`
        });
      }

      findings.push(
        ...packageRegistryInvariant(
          packageRegistry.entries,
          observedPackages,
          packageRegistry.source
        )
      );
    }
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
      surface: governedRepos.source,
      invariant: "no_orphan_surfaces",
      expected: 35,
      observed: acceptedGraph.length,
      source_of_truth: governedRepos.source,
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

  const repairPlan = compileRepairPlan(findings);
  const markdownReport = renderMarkdownReport(report);
  const findingLists = buildFindingListArtifacts(report);
  const mergeVerdict = buildMergeVerdictArtifact(report);
  const currentArtifactPaths = [
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
    "acceptance-readiness.json",
    "actuator-readiness.json"
  ];
  const acceptanceReadiness = buildAcceptanceReadinessArtifact({
    report,
    acceptedGraphCount: acceptedGraph.length,
    currentArtifactPaths,
    implementedCapabilities: [
      "repo_perimeter_mismatch",
      "license_registry_consistency",
      "package_registry_consistency",
      "repo_class_registry_consistency",
      "authority_scope_mismatch",
      "receipt_identity_collision",
      "merge_verdict_mapping",
      "history_snapshot_manifest"
    ],
    truthMutationAllowed: false
  });

  const actuatorReadiness = buildActuatorReadiness({ root });

  mkdirSync("reports/current", { recursive: true });
  writeFileSync("reports/current/accepted-graph.json", JSON.stringify(acceptedGraph, null, 2) + "\n");
  writeFileSync("reports/current/candidate-graph.json", JSON.stringify(candidateInventory, null, 2) + "\n");
  writeFileSync("reports/current/repair-plan.json", JSON.stringify(repairPlan, null, 2) + "\n");
  writeFileSync("reports/current/admissibility-report.json", JSON.stringify(report, null, 2) + "\n");
  writeFileSync("reports/current/admissibility-report.md", markdownReport);
  writeFileSync("reports/current/red-list.json", JSON.stringify(findingLists.redList, null, 2) + "\n");
  writeFileSync("reports/current/yellow-list.json", JSON.stringify(findingLists.yellowList, null, 2) + "\n");
  writeFileSync("reports/current/green-list.json", JSON.stringify(findingLists.greenList, null, 2) + "\n");
  writeFileSync("reports/current/quarantine-list.json", JSON.stringify(findingLists.quarantineList, null, 2) + "\n");
  writeFileSync("reports/current/merge-verdict.json", JSON.stringify(mergeVerdict, null, 2) + "\n");
  writeFileSync("reports/current/acceptance-readiness.json", JSON.stringify(acceptanceReadiness, null, 2) + "\n");
  writeFileSync("reports/current/actuator-readiness.json", JSON.stringify(actuatorReadiness, null, 2) + "\n");
  writeHistorySnapshot(".", report, {
    acceptedGraph,
    candidateGraph: candidateInventory,
    repairPlan,
    markdownReport,
    redList: findingLists.redList,
    yellowList: findingLists.yellowList,
    greenList: findingLists.greenList,
    quarantineList: findingLists.quarantineList,
    mergeVerdict,
    acceptanceReadiness,
    actuatorReadiness
  });

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.red_count > 0 ? 2 : report.yellow_count > 0 ? 1 : 0);
}

main();
