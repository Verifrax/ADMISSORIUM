import fs from "node:fs";
import path from "node:path";
import { classifyMutation } from "../admission/classify-mutation.js";
import { compileActuatorVerdict } from "../admission/compile-actuator-verdict.js";
import { compileAdmissionReceipt } from "../admission/compile-admission-receipt.js";
import { compileDryRunRepairPlan } from "../repair/compile-dry-run-repair-plan.js";
import { compileQuarantineRecord } from "../quarantine/compile-quarantine-record.js";
import { buildV020Readiness } from "../reports/write-v020-readiness.js";

const repo = process.env.ADMISSORIUM_REPO || "Verifrax/ADMISSORIUM";
const paths = (process.env.ADMISSORIUM_CHANGED_FILES || "README.md").split(",").filter(Boolean);
const mutation = classifyMutation(paths);
const verdict = compileActuatorVerdict({ repo, paths, decision: mutation.decision });
const receipt = compileAdmissionReceipt(mutation.decision);
const dryRun = compileDryRunRepairPlan(repo, paths);
const quarantine = mutation.decision.startsWith("BLOCKED")
  ? compileQuarantineRecord(repo, mutation.mutation_class, "mutation violates ADMISSORIUM v0.2.0 admissibility law")
  : null;
const readiness = buildV020Readiness();

fs.mkdirSync(path.join(process.cwd(), "reports", "current"), { recursive: true });
fs.writeFileSync("reports/current/actuator-verdict.json", JSON.stringify(verdict, null, 2) + "\n");
fs.writeFileSync("reports/current/admission-receipt.json", JSON.stringify(receipt, null, 2) + "\n");
fs.writeFileSync("reports/current/dry-run-repair-plan.json", JSON.stringify(dryRun, null, 2) + "\n");
fs.writeFileSync("reports/current/quarantine-record.json", JSON.stringify(quarantine, null, 2) + "\n");
fs.writeFileSync("reports/current/v020-readiness.json", JSON.stringify(readiness, null, 2) + "\n");

console.log(JSON.stringify({ mutation, verdict: verdict.decision, readiness: readiness.ready }, null, 2));
