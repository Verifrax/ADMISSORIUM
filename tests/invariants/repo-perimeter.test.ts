import test from "node:test";
import assert from "node:assert/strict";
import { repoPerimeterInvariant } from "../../invariants/repo-perimeter.js";

test("repo perimeter mismatch is red", () => {
  const findings = repoPerimeterInvariant(["Verifrax/A", "Verifrax/B"], ["Verifrax/A", "Verifrax/C"]);
  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.finding_id, "RED-REPO-PERIMETER-MISMATCH");
});
