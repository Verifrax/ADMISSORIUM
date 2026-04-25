import test from "node:test";
import assert from "node:assert/strict";
import { packageRegistryInvariant } from "../../invariants/package-registry.js";

test("same package assigned to two source repos is red", () => {
  const findings = packageRegistryInvariant(
    [
      { package: "@verifrax/x", repo: "Verifrax/A" },
      { package: "@verifrax/x", repo: "Verifrax/B" }
    ],
    [],
    ".github/governance/PACKAGES.json"
  );

  assert.equal(findings.some((finding) => finding.finding_id === "RED-PACKAGE-REGISTRY-SOURCE-CONFLICT"), true);
});

test("live package absent from registry is yellow", () => {
  const findings = packageRegistryInvariant(
    [],
    [{ repo: "Verifrax/A", name: "@verifrax/a", path: "Verifrax/A:package.json" }],
    ".github/governance/PACKAGES.json"
  );

  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.finding_id, "YELLOW-LIVE-PACKAGE-MISSING-FROM-REGISTRY");
});
