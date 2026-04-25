import test from "node:test";
import assert from "node:assert/strict";
import { receiptIdentityInvariant } from "../../invariants/receipt-identity.js";
test("same receipt id with different body is red",()=>{const findings=receiptIdentityInvariant([{repo:"A",path:"r.json",receipt_id:"R1",body:{receipt_id:"R1",version:"v1"}},{repo:"B",path:"r.json",receipt_id:"R1",body:{receipt_id:"R1",version:"v2"}}]);assert.equal(findings.length,1);assert.equal(findings[0]?.severity,"RED");});
