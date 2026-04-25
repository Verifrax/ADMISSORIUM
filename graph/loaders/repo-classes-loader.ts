import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface RepoClassRegistryEntry {
  repo: string;
  class: string;
  primary_role: string;
  sovereign_chamber?: boolean;
  truth_owner?: boolean;
  projection_owner?: boolean;
  package_allowed?: boolean;
  host_allowed?: boolean;
  may_operate_github_app?: boolean;
  may_open_projection_repair_prs?: boolean;
  may_block_merge?: boolean;
  may_quarantine?: boolean;
  may_rewrite_current_truth_objects?: boolean;
  requires_required_check?: boolean;
}

export interface RepoClassRegistryLoad {
  entries: RepoClassRegistryEntry[];
  source: string;
  present: boolean;
}

function isRepoClassRegistryEntry(value: unknown): value is RepoClassRegistryEntry {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.repo === "string" &&
    typeof candidate.class === "string" &&
    typeof candidate.primary_role === "string"
  );
}

export function loadRepoClassRegistry(root: string): RepoClassRegistryLoad {
  const candidates = [
    join(root, ".github", "governance", "REPO_CLASSES.json"),
    join(root, "governance", "REPO_CLASSES.json")
  ];

  for (const path of candidates) {
    if (!existsSync(path)) continue;

    const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
    const entries = Array.isArray((parsed as { entries?: unknown }).entries)
      ? (parsed as { entries: unknown[] }).entries
      : [];

    return {
      entries: entries.filter(isRepoClassRegistryEntry),
      source: path,
      present: true
    };
  }

  return {
    entries: [],
    source: "REPO_CLASSES_REGISTRY_ABSENT",
    present: false
  };
}
