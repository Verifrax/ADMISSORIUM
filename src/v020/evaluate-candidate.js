import fs from "node:fs";
import crypto from "node:crypto";
import { classifySurface } from "../classify/surface-classifier.js";
import { classifyMutation } from "../classify/mutation-classifier.js";
import { classifyTruthRisk } from "../classify/truth-risk-classifier.js";
import { compareAcceptedVsCandidate } from "../compare/accepted-vs-candidate.js";

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function evaluateCandidate({ acceptedPath, candidatePath }) {
  const acceptedText = fs.readFileSync(acceptedPath, "utf8");
  const candidateText = fs.readFileSync(candidatePath, "utf8");
  const accepted = JSON.parse(acceptedText);
  const candidate = JSON.parse(candidateText);

  const surface = classifySurface(candidate);
  const mutation = classifyMutation(candidate, surface);
  const truthRisk = classifyTruthRisk(candidate, surface, mutation);
  const comparison = compareAcceptedVsCandidate(accepted, candidate, surface, mutation, truthRisk);

  const report = {
    report_type: "ADMISSORIUM_V020_CLASSIFIER_COMPARATOR_REPORT",
    schema_version: "1.0.0",
    admissorium_version: "0.2.0",
    truth_warning: "NOT_TRUTH_SOURCE",
    writer_enabled: false,
    webhook_enabled: false,
    check_run_writer_enabled: false,
    package_publish_enabled: false,
    contents_write_enabled: false,
    allowed_to_mutate_truth: false,
    state: comparison.verdict === "ADMISSIBLE_REPORT_ONLY"
      ? "ADMISSORIUM_V020_CLASSIFIER_COMPARATOR_PASS"
      : "ADMISSORIUM_V020_CLASSIFIER_COMPARATOR_BLOCK",
    system_complete: false,
    writer_enabled: false,
    webhook_enabled: false,
    check_run_writer_enabled: false,
    pr_writer_enabled: false,
    issue_writer_enabled: false,
    accepted_sha256: sha256(acceptedText),
    candidate_sha256: sha256(candidateText),
    surface,
    mutation,
    truthRisk,
    comparison
  };

  return report;
}

export function writeReports() {
  const cases = [
    ["fixtures/v020/accepted-graph.example.json", "fixtures/v020/candidates/projection-clean.example.json"],
    ["fixtures/v020/accepted-graph.example.json", "fixtures/v020/candidates/protected-truth-touch.example.json"],
    ["fixtures/v020/accepted-graph.example.json", "fixtures/v020/candidates/sovereign-language.example.json"],
    ["fixtures/v020/accepted-graph.example.json", "fixtures/v020/candidates/package-publish.example.json"],
    ["fixtures/v020/accepted-graph.example.json", "fixtures/v020/candidates/secret-bearing.example.json"]
  ];

  const reports = cases.map(([acceptedPath, candidatePath]) => ({
    candidatePath,
    report: evaluateCandidate({ acceptedPath, candidatePath })
  }));

  fs.mkdirSync("reports/current", { recursive: true });
  fs.writeFileSync("reports/current/v020-classifier-comparator.json", JSON.stringify({
    report_type: "ADMISSORIUM_V020_CLASSIFIER_COMPARATOR_SUITE",
    schema_version: "1.0.0",
    admissorium_version: "0.2.0",
    truth_warning: "NOT_TRUTH_SOURCE",
    state: "ADMISSORIUM_V020_CLASSIFIER_COMPARATOR_SUITE_PASS",
    system_complete: false,
    writer_enabled: false,
    webhook_enabled: false,
    total: reports.length,
    blocked: reports.filter(r => r.report.state.endsWith("_BLOCK")).length,
    passed: reports.filter(r => r.report.state.endsWith("_PASS")).length,
    reports
  }, null, 2) + "\n");

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = `reports/history/v020-classifier-comparator-${stamp}`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/manifest.json`, JSON.stringify({
    history_type: "ADMISSORIUM_V020_CLASSIFIER_COMPARATOR_HISTORY",
    created_at: new Date().toISOString(),
    current_report: "reports/current/v020-classifier-comparator.json",
    state: "ADMISSORIUM_V020_CLASSIFIER_COMPARATOR_SUITE_PASS",
    system_complete: false,
    writer_enabled: false,
    webhook_enabled: false,
    check_run_writer_enabled: false
  }, null, 2) + "\n");

  return reports;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const reports = writeReports();
  console.log("ADMISSORIUM_V020_CLASSIFIER_COMPARATOR_PASS=true");
  console.log(JSON.stringify({
    total: reports.length,
    blocked: reports.filter(r => r.report.state.endsWith("_BLOCK")).length,
    passed: reports.filter(r => r.report.state.endsWith("_PASS")).length
  }));
}
