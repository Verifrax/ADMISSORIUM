import test from "node:test";
import assert from "node:assert/strict";
import { repoClassRegistryInvariant } from "../../invariants/repo-class-registry.js";

test("repo class registry missing governed repo is red", () => {
  const findings = repoClassRegistryInvariant(
    ["Verifrax/A", "Verifrax/B"],
    [{ repo: "Verifrax/A", class: "x", primary_role: "x" }],
    ".github/governance/REPO_CLASSES.json"
  );

  assert.equal(findings.some((finding) => finding.finding_id === "RED-REPO-CLASS-PERIMETER-MISMATCH"), true);
});

test("duplicate repo class entry is red", () => {
  const findings = repoClassRegistryInvariant(
    ["Verifrax/A"],
    [
      { repo: "Verifrax/A", class: "x", primary_role: "x" },
      { repo: "Verifrax/A", class: "y", primary_role: "y" }
    ],
    ".github/governance/REPO_CLASSES.json"
  );

  assert.equal(findings.some((finding) => finding.finding_id === "RED-REPO-CLASS-DUPLICATE"), true);
});

test("ADMISSORIUM truth ownership classification is red", () => {
  const findings = repoClassRegistryInvariant(
    ["Verifrax/ADMISSORIUM"],
    [{
      repo: "Verifrax/ADMISSORIUM",
      class: "admissibility_enforcement_implementation",
      primary_role: "admission_gate_actuator",
      sovereign_chamber: false,
      truth_owner: true,
      may_rewrite_current_truth_objects: false
    }],
    ".github/governance/REPO_CLASSES.json"
  );

  assert.equal(findings.some((finding) => finding.finding_id === "RED-ADMISSORIUM-ROLE-BOUNDARY"), true);
});
