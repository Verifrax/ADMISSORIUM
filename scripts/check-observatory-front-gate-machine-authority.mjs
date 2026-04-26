#!/usr/bin/env node
import fs from "node:fs";

const doc = fs.readFileSync("docs/observatory-front-gate-machine-authority.md", "utf8");
const data = JSON.parse(fs.readFileSync("evidence/observatory-front-gate/admissorium-front-gate-machine-authority.json", "utf8"));

function must(name, ok) {
  if (!ok) {
    console.error(`[ADMISSORIUM_FRONT_GATE_FAIL] ${name}`);
    process.exit(1);
  }
  console.log(`${name} PASS`);
}

must("schema", data.schema === "verifrax.admissorium.front_gate.machine_authority.v1");
must("front_gate_role", data.observatory_role === "front_gate");
must("not_truth_owner", data.truth_owner === false);
must("not_sovereign_chamber", data.sovereign_chamber === false);
must("owns_admissibility", data.owns.includes("admissibility_enforcement"));
must("owns_contradiction_blocking", data.owns.includes("contradiction_blocking"));
must("owns_quarantine_routing", data.owns.includes("quarantine_routing"));
must("must_not_own_truth", data.must_not_own.includes("truth_source"));
must("must_not_own_accepted_state", data.must_not_own.includes("accepted_state"));
must("must_not_own_recognition", data.must_not_own.includes("terminal_recognition"));
must("must_not_own_recourse", data.must_not_own.includes("terminal_recourse"));
must("denial_transition", data.valid_transitions.includes("contradiction_to_denial"));
must("recourse_transition", data.valid_transitions.includes("denial_to_recourse"));
must("www_binding", data.observatory_binding.surface === "VERIFRAX-WWW");
must("repo_35", data.observatory_binding.repo_index === 35);
must("red_restricted_zone", data.observatory_binding.restricted_emission === "red");
must("doc_boundary_language", doc.includes("not a truth source") && doc.includes("not a sovereign chamber"));
