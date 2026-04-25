import type { Finding } from "../src/types.js";
import type { PackageRegistryEntry } from "../graph/loaders/packages-loader.js";
import { packageName, packageSourceRepo } from "../graph/loaders/packages-loader.js";

export interface ObservedPackage {
  repo: string;
  name: string;
  path: string;
}

export function packageRegistryInvariant(
  registryEntries: PackageRegistryEntry[],
  observedPackages: ObservedPackage[],
  sourceOfTruth: string
): Finding[] {
  const findings: Finding[] = [];

  const registryByName = new Map<string, string[]>();
  for (const entry of registryEntries) {
    const name = packageName(entry);
    const sourceRepo = packageSourceRepo(entry);
    if (!name || !sourceRepo) continue;

    const bucket = registryByName.get(name) ?? [];
    bucket.push(sourceRepo);
    registryByName.set(name, bucket);
  }

  for (const [name, sources] of registryByName.entries()) {
    const uniqueSources = [...new Set(sources)];
    if (uniqueSources.length > 1) {
      findings.push({
        finding_id: "RED-PACKAGE-REGISTRY-SOURCE-CONFLICT",
        severity: "RED",
        repo: "Verifrax/.github",
        surface: name,
        invariant: "one_package_one_source_repo",
        expected: "exactly one source repo per package",
        observed: uniqueSources,
        source_of_truth: sourceOfTruth,
        autofix_allowed: false,
        recommended_action: "Resolve package source ownership through governance review."
      });
    }
  }

  const observedByName = new Map(observedPackages.map((pkg) => [pkg.name, pkg]));
  for (const [name, sources] of registryByName.entries()) {
    if (!observedByName.has(name)) {
      findings.push({
        finding_id: "YELLOW-PACKAGE-REGISTRY-MISSING-LIVE-PACKAGE",
        severity: "YELLOW",
        repo: sources[0] ?? "Verifrax/.github",
        surface: name,
        invariant: "package_registry_matches_materialized_packages",
        expected: "registered package is materialized locally when source repo is present",
        observed: "package not found in local package.json inventory",
        source_of_truth: sourceOfTruth,
        autofix_allowed: false,
        recommended_action: "Confirm whether package is historical, unpublished, or missing from local materialization."
      });
    }
  }

  const registryNames = new Set(registryByName.keys());
  for (const observed of observedPackages) {
    if (!registryNames.has(observed.name)) {
      findings.push({
        finding_id: "YELLOW-LIVE-PACKAGE-MISSING-FROM-REGISTRY",
        severity: "YELLOW",
        repo: observed.repo,
        surface: observed.path,
        invariant: "package_registry_matches_materialized_packages",
        expected: "live package is represented in governance package registry",
        observed: observed.name,
        source_of_truth: sourceOfTruth,
        autofix_allowed: false,
        recommended_action: "Add package to package registry through governance review or mark it non-canonical."
      });
    }
  }

  return findings;
}
