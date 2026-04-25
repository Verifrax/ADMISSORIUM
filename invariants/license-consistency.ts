import type { Finding } from "../src/types.js";

function expectedLicenseSignal(license: string): RegExp {
  switch (license) {
    case "Apache-2.0":
      return /Apache License/i;
    case "AGPL-3.0":
      return /GNU Affero General Public License|Affero General Public License/i;
    case "GPL-3.0":
      return /GNU General Public License/i;
    case "MPL-2.0":
      return /Mozilla Public License/i;
    default:
      return new RegExp(license.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }
}

export function licenseConsistencyInvariant(
  repo: string,
  licenseText: string | null,
  readmeText: string | null,
  expectedLicense: string,
  sourceOfTruth = ".github/governance/LICENSES.json"
): Finding[] {
  const findings: Finding[] = [];

  if (!licenseText) {
    findings.push({
      finding_id: "YELLOW-LICENSE-MISSING",
      severity: "YELLOW",
      repo,
      surface: "LICENSE",
      invariant: "one_license_truth",
      expected: expectedLicense,
      observed: "LICENSE missing",
      source_of_truth: sourceOfTruth,
      autofix_allowed: true,
      recommended_action: "Add LICENSE matching governance license registry."
    });
    return findings;
  }

  if (!expectedLicenseSignal(expectedLicense).test(licenseText)) {
    findings.push({
      finding_id: "YELLOW-LICENSE-FILE-MISMATCH",
      severity: "YELLOW",
      repo,
      surface: "LICENSE",
      invariant: "one_license_truth",
      expected: expectedLicense,
      observed: "LICENSE text does not expose the expected license signal",
      source_of_truth: sourceOfTruth,
      autofix_allowed: true,
      recommended_action: "Align LICENSE text with governance license registry."
    });
  }

  if (repo === "Verifrax/AUCTORISEAL" && readmeText) {
    const saysGpl = readmeText.includes("GNU General Public License v3.0");
    const saysAgpl = readmeText.includes("GNU Affero General Public License v3.0");

    if (expectedLicense === "AGPL-3.0" && saysGpl && !saysAgpl) {
      findings.push({
        finding_id: "YELLOW-AUCTORISEAL-LICENSE-WORDING",
        severity: "YELLOW",
        repo,
        surface: "README.md",
        invariant: "one_license_truth",
        expected: "GNU Affero General Public License v3.0",
        observed: "GNU General Public License v3.0",
        source_of_truth: sourceOfTruth,
        autofix_allowed: true,
        recommended_action: "Normalize README wording to AGPL-3.0."
      });
    }
  }

  return findings;
}
