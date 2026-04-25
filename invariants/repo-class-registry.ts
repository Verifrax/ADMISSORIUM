import type { Finding } from "../src/types.js";
import type { RepoClassRegistryEntry } from "../graph/loaders/repo-classes-loader.js";

export function repoClassRegistryInvariant(
  governedRepos: string[],
  entries: RepoClassRegistryEntry[],
  sourceOfTruth: string
): Finding[] {
  const findings: Finding[] = [];
  const governed = new Set(governedRepos);

  const byRepo = new Map<string, RepoClassRegistryEntry[]>();
  for (const entry of entries) {
    const bucket = byRepo.get(entry.repo) ?? [];
    bucket.push(entry);
    byRepo.set(entry.repo, bucket);
  }

  for (const [repo, bucket] of byRepo.entries()) {
    if (bucket.length > 1) {
      findings.push({
        finding_id: "RED-REPO-CLASS-DUPLICATE",
        severity: "RED",
        repo,
        surface: sourceOfTruth,
        invariant: "one_repo_one_class_registry_entry",
        expected: "exactly one repo class entry per governed repository",
        observed: bucket.length,
        source_of_truth: sourceOfTruth,
        autofix_allowed: false,
        recommended_action: "Resolve duplicate repository class entries through governance review."
      });
    }
  }

  const classRepos = new Set(entries.map((entry) => entry.repo));
  const missing = governedRepos.filter((repo) => !classRepos.has(repo));
  const extra = entries.map((entry) => entry.repo).filter((repo) => !governed.has(repo));

  if (missing.length > 0 || extra.length > 0) {
    findings.push({
      finding_id: "RED-REPO-CLASS-PERIMETER-MISMATCH",
      severity: "RED",
      repo: "Verifrax/.github",
      surface: sourceOfTruth,
      invariant: "repo_class_registry_matches_governed_repos",
      expected: governedRepos,
      observed: { missing, extra },
      source_of_truth: sourceOfTruth,
      autofix_allowed: false,
      recommended_action: "Align repository class registry with governed repository registry through governance review."
    });
  }

  const admissorium = entries.find((entry) => entry.repo === "Verifrax/ADMISSORIUM");
  if (admissorium) {
    const invalid =
      admissorium.class !== "admissibility_enforcement_implementation" ||
      admissorium.primary_role !== "admission_gate_actuator" ||
      admissorium.sovereign_chamber !== false ||
      admissorium.truth_owner !== false ||
      admissorium.may_rewrite_current_truth_objects !== false;

    if (invalid) {
      findings.push({
        finding_id: "RED-ADMISSORIUM-ROLE-BOUNDARY",
        severity: "RED",
        repo: "Verifrax/ADMISSORIUM",
        surface: sourceOfTruth,
        invariant: "admissorium_is_admissibility_enforcement_not_truth",
        expected: {
          class: "admissibility_enforcement_implementation",
          primary_role: "admission_gate_actuator",
          sovereign_chamber: false,
          truth_owner: false,
          may_rewrite_current_truth_objects: false
        },
        observed: admissorium,
        source_of_truth: sourceOfTruth,
        autofix_allowed: false,
        recommended_action: "Restore ADMISSORIUM to implementation/admissibility enforcement classification through governance review."
      });
    }
  }

  return findings;
}
