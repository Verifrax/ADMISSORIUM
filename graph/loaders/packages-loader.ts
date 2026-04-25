import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface PackageRegistryEntry {
  repo: string;
  package?: string;
  name?: string;
  source_repo?: string;
  class?: string;
  package_class?: string;
  canonical?: boolean;
  live?: boolean;
}

export interface PackageRegistryLoad {
  entries: PackageRegistryEntry[];
  source: string;
  present: boolean;
}

function isPackageRegistryEntry(value: unknown): value is PackageRegistryEntry {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.repo === "string" ||
    typeof candidate.source_repo === "string" ||
    typeof candidate.package === "string" ||
    typeof candidate.name === "string"
  );
}

export function packageName(entry: PackageRegistryEntry): string | null {
  return entry.package ?? entry.name ?? null;
}

export function packageSourceRepo(entry: PackageRegistryEntry): string | null {
  return entry.source_repo ?? entry.repo ?? null;
}

export function loadPackageRegistry(root: string): PackageRegistryLoad {
  const candidates = [
    join(root, ".github", "governance", "PACKAGES.json"),
    join(root, "governance", "PACKAGES.json")
  ];

  for (const path of candidates) {
    if (!existsSync(path)) continue;

    const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
    const entries = Array.isArray((parsed as { entries?: unknown }).entries)
      ? (parsed as { entries: unknown[] }).entries
      : Array.isArray(parsed)
        ? parsed
        : [];

    return {
      entries: entries.filter(isPackageRegistryEntry),
      source: path,
      present: true
    };
  }

  return {
    entries: [],
    source: "PACKAGES_REGISTRY_ABSENT",
    present: false
  };
}
