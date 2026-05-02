import { loadPolicy } from "./load-policy.js";

type ProtectedPolicy = { protected_paths: string[] };

function globToRegExp(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*");
  return new RegExp(`^${escaped}$`);
}

export function protectedTruthPathHits(paths: string[]): string[] {
  const policy = loadPolicy<ProtectedPolicy>("protected-truth-paths.json");
  const matchers: RegExp[] = policy.protected_paths.map(globToRegExp);
  return paths.filter((p) => matchers.some((m: RegExp) => m.test(p)));
}

export function evaluateProtectedTruthPaths(paths: string[]) {
  const hits = protectedTruthPathHits(paths);
  return {
    protected_path_touched: hits.length > 0,
    hits,
    automatic_projection_repair_allowed: hits.length === 0,
    direct_write_allowed: false
  };
}
