import test from "node:test";
import assert from "node:assert/strict";
import { licenseConsistencyInvariant } from "../../invariants/license-consistency.js";

test("missing required license is yellow", () => {
  const findings = licenseConsistencyInvariant("Verifrax/ADMISSORIUM", null, null, "Apache-2.0");
  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.finding_id, "YELLOW-LICENSE-MISSING");
});

test("AUCTORISEAL GPL wording under AGPL expectation is yellow", () => {
  const findings = licenseConsistencyInvariant(
    "Verifrax/AUCTORISEAL",
    "GNU Affero General Public License",
    "GNU General Public License v3.0",
    "AGPL-3.0"
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.finding_id, "YELLOW-AUCTORISEAL-LICENSE-WORDING");
});
