import type { GraphNode } from "../../src/types.js";

export function buildAcceptedGraph(governedRepos: readonly string[], sourceOfTruth: string): GraphNode[] {
  return governedRepos.map((repo) => ({
    id: repo,
    type: "Repo",
    status: repo === "Verifrax/ADMISSORIUM" ? "DERIVED_PROJECTION" : "ACTIVE_TRUTH",
    owner_repo: repo,
    source_of_truth: sourceOfTruth,
    may_autofix: false,
    admissibility: repo === "Verifrax/ADMISSORIUM" ? "REQUIRES_ACCEPTANCE_ACT" : "ADMISSIBLE",
    metadata: {
      expected_perimeter_count_after_admissorium: 35
    }
  }));
}
