import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export interface LocalRepoInventory {
  repo: string;
  path: string;
  has_git: boolean;
  has_readme: boolean;
  has_license: boolean;
  has_package_json: boolean;
  has_surface_host: boolean;
}

export function discoverLocalRepos(root: string, org: string): LocalRepoInventory[] {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => existsSync(join(root, entry.name, ".git")))
    .map((entry) => {
      const path = join(root, entry.name);
      return {
        repo: `${org}/${entry.name}`,
        path,
        has_git: true,
        has_readme: existsSync(join(path, "README.md")),
        has_license: existsSync(join(path, "LICENSE")),
        has_package_json: existsSync(join(path, "package.json")),
        has_surface_host: existsSync(join(path, "surface.host.json"))
      };
    })
    .sort((a, b) => a.repo.localeCompare(b.repo));
}
