import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { evaluateCandidate, writeReports } from "../../src/v020/evaluate-candidate.js";

const acceptedPath = "fixtures/v020/accepted-graph.example.json";

function evalFixture(name) {
  return evaluateCandidate({
    acceptedPath,
    candidatePath: `fixtures/v020/candidates/${name}.example.json`
  });
}

test("accepted-vs-candidate allows clean projection in report-only mode", () => {
  const report = evalFixture("projection-clean");
  assert.equal(report.state, "ADMISSORIUM_V020_CLASSIFIER_COMPARATOR_PASS");
  assert.equal(report.comparison.verdict, "ADMISSIBLE_REPORT_ONLY");
  assert.equal(report.comparison.repair_mode, "DRY_RUN_ONLY");
  assert.equal(report.writer_enabled, false);
  assert.equal(report.webhook_enabled, false);
});

test("accepted-vs-candidate blocks protected truth touch", () => {
  const report = evalFixture("protected-truth-touch");
  assert.equal(report.state, "ADMISSORIUM_V020_CLASSIFIER_COMPARATOR_BLOCK");
  assert.ok(report.comparison.contradiction.includes("protected_truth_path_mutation"));
  assert.equal(report.comparison.merge_allowed, false);
});

test("suite report and history are generated without writer power", () => {
  writeReports();

  const suite = JSON.parse(fs.readFileSync("reports/current/v020-classifier-comparator.json", "utf8"));
  assert.equal(suite.state, "ADMISSORIUM_V020_CLASSIFIER_COMPARATOR_SUITE_PASS");
  assert.equal(suite.system_complete, false);
  assert.equal(suite.writer_enabled, false);
  assert.equal(suite.webhook_enabled, false);
  assert.equal(suite.total, 5);
  assert.equal(suite.blocked, 4);
  assert.equal(suite.passed, 1);
});
