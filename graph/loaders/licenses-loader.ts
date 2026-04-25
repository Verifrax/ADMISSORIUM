import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface LicenseRegistryEntry {
  repo: string;
  license: string;
  license_file_required: boolean;
  readme_license_required: boolean;
  package_json_license_required_if_present: boolean;
}

export interface LicenseRegistryLoad {
  entries: LicenseRegistryEntry[];
  source: string;
  present: boolean;
}

function isLicenseRegistryEntry(value: unknown): value is LicenseRegistryEntry {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.repo === "string" &&
    typeof candidate.license === "string" &&
    typeof candidate.license_file_required === "boolean" &&
    typeof candidate.readme_license_required === "boolean" &&
    typeof candidate.package_json_license_required_if_present === "boolean"
  );
}

export function loadLicenseRegistry(root: string): LicenseRegistryLoad {
  const candidates = [
    join(root, ".github", "governance", "LICENSES.json"),
    join(root, "governance", "LICENSES.json")
  ];

  for (const path of candidates) {
    if (!existsSync(path)) continue;

    const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
    const entries = Array.isArray((parsed as { entries?: unknown }).entries)
      ? (parsed as { entries: unknown[] }).entries
      : [];

    return {
      entries: entries.filter(isLicenseRegistryEntry),
      source: path,
      present: true
    };
  }

  return {
    entries: [],
    source: "LICENSES_REGISTRY_ABSENT",
    present: false
  };
}
