import test from "node:test";
import assert from "node:assert/strict";
import { checkRunConclusion } from "../../app/check-run-writer.js";
import type { AdmissibilityReport } from "../../src/types.js";
test("red report fails check",()=>{const report:AdmissibilityReport={run_id:"r",started_at:"now",org:"Verifrax",mode:"audit",accepted_graph_ref:"a",candidate_graph_ref:"c",verdict:"INADMISSIBLE",red_count:1,yellow_count:0,green_count:0,quarantine_count:0,findings:[],repair_plan_ref:"p"};assert.equal(checkRunConclusion(report),"failure");});
