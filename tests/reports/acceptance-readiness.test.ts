import test from "node:test";
import assert from "node:assert/strict";
import { buildAcceptanceReadinessArtifact } from "../../reports/acceptance-readiness.js";
import type { AdmissibilityReport } from "../../src/types.js";

function report(): AdmissibilityReport {
  return {
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
}

const artifactPaths = [
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
  "acceptance-readiness.json"
];

const capabilities = [
  "repo_perimeter_mismatch",
  "license_registry_consistency",
  "package_registry_consistency",
  "repo_class_registry_consistency",
  "authority_scope_mismatch",
  "receipt_identity_collision",
  "merge_verdict_mapping",
  "history_snapshot_manifest"
];

test("passes v0.1.0 readiness when required capabilities and artifacts exist", () => {
  const readiness = buildAcceptanceReadinessArtifact({
    report: report(),
    acceptedGraphCount: 35,
    currentArtifactPaths: artifactPaths,
    implementedCapabilities: capabilities,
    truthMutationAllowed: false
  });

  assert.equal(readiness.version, "0.1.0");
  assert.equal(readiness.ready, true);
  assert.equal(readiness.failed_count, 0);
  assert.equal(readiness.criteria.every((criterion) => criterion.status === "PASS"), true);
});

test("fails readiness when sovereign truth mutation is allowed", () => {
  const readiness = buildAcceptanceReadinessArtifact({
    report: report(),
    acceptedGraphCount: 35,
    currentArtifactPaths: artifactPaths,
    implementedCapabilities: capabilities,
    truthMutationAllowed: true
  });

  assert.equal(readiness.ready, false);
  assert.equal(readiness.criteria.some((criterion) => criterion.id === "V010-016" && criterion.status === "FAIL"), true);
});
