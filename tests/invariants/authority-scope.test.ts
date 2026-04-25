import test from "node:test";
import assert from "node:assert/strict";
import { authorityScopeInvariant } from "../../invariants/authority-scope.js";
test("different authority scopes are red",()=>{const findings=authorityScopeInvariant({governed:["A","B"],current:["A","C"]});assert.equal(findings.length,1);assert.equal(findings[0]?.finding_id,"RED-AUTHORITY-SCOPE-MISMATCH");});
