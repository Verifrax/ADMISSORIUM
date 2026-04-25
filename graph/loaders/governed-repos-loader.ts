import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BOOTSTRAP_GOVERNED_REPOS_35 } from "../../src/constants.js";

export interface GovernedReposLoad {
  repos: string[];
  source: string;
  used_bootstrap: boolean;
}

function parseGovernedRepos(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith("#"));
}

export function loadGovernedRepos(root: string): GovernedReposLoad {
  const candidates = [
    join(root, ".github", "governance", "GOVERNED_REPOS.txt"),
    join(root, "governance", "GOVERNED_REPOS.txt")
  ];

  for (const path of candidates) {
    if (!existsSync(path)) continue;

    const repos = parseGovernedRepos(readFileSync(path, "utf8"));

    return {
      repos,
      source: path,
      used_bootstrap: false
    };
  }

  return {
    repos: [...BOOTSTRAP_GOVERNED_REPOS_35],
    source: "BOOTSTRAP_GOVERNED_REPOS_35",
    used_bootstrap: true
  };
}
