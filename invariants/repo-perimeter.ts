import type { Finding } from "../src/types.js";

export function repoPerimeterInvariant(expectedRepos: string[], observedRepos: string[]): Finding[] {
  const expected = new Set(expectedRepos);
  const observed = new Set(observedRepos);
  const missing = expectedRepos.filter((repo) => !observed.has(repo));
  const extra = observedRepos.filter((repo) => !expected.has(repo));

  if (missing.length === 0 && extra.length === 0) return [];

  return [{
    finding_id: "RED-REPO-PERIMETER-MISMATCH",
    severity: "RED",
    repo: "Verifrax/.github",
    surface: "governance/GOVERNED_REPOS.txt + local materialization inventory",
    invariant: "governed_repo_perimeter_matches_materialization",
    expected: expectedRepos,
    observed: { missing, extra },
    source_of_truth: ".github/governance/GOVERNED_REPOS.txt",
    autofix_allowed: false,
    recommended_action: "Reconcile governed repository registry against live materialization through governance review."
  }];
}
