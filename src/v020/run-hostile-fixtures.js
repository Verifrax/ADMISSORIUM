import fs from "node:fs";
import path from "node:path";
import { evaluateHostileFixture } from "../hostile/evaluate-hostile-fixture.js";

const fixtureDir = "fixtures/v020/hostile";
const reportPath = "reports/current/admissorium-v020-hostile-fixtures.json";
const historyDir = `reports/history/admissorium-v020-hostile-fixtures-${new Date().toISOString().replaceAll(":", "-")}`;

fs.mkdirSync("reports/current", { recursive: true });
fs.mkdirSync(historyDir, { recursive: true });

const files = fs.readdirSync(fixtureDir).filter((file) => file.endsWith(".json")).sort();
const results = files.map((file) => {
  const fixture = JSON.parse(fs.readFileSync(path.join(fixtureDir, file), "utf8"));
  return evaluateHostileFixture(fixture);
});

const failed = results.filter((result) => !result.passed);
const admitted = results.filter((result) => result.admitted);
const writerViolations = results.filter((result) =>
  result.writer_enabled ||
  result.webhook_enabled ||
  result.check_run_writer_enabled ||
  result.contents_write_enabled ||
  result.allowed_to_mutate_truth
);

const report = {
  suite: "ADMISSORIUM_V020_HOSTILE_FIXTURE_BATTERY",
  state: failed.length === 0 && admitted.length === 0 && writerViolations.length === 0
    ? "ADMISSORIUM_V020_HOSTILE_FIXTURES_PASS"
    : "ADMISSORIUM_V020_HOSTILE_FIXTURES_FAIL",
  truth_warning: "NOT_TRUTH_SOURCE",
  writer_enabled: false,
  webhook_enabled: false,
  check_run_writer_enabled: false,
  contents_write_enabled: false,
  allowed_to_mutate_truth: false,
  total: results.length,
  blocked: results.filter((result) => result.passed).length,
  admitted: admitted.length,
  writer_violations: writerViolations.length,
  failed: failed.length,
  results
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
fs.writeFileSync(path.join(historyDir, "admissorium-v020-hostile-fixtures.json"), JSON.stringify(report, null, 2) + "\n");

if (report.state === "ADMISSORIUM_V020_HOSTILE_FIXTURES_PASS") {
  console.log("ADMISSORIUM_V020_HOSTILE_FIXTURES_PASS=true");
  console.log(JSON.stringify({
    total: report.total,
    blocked: report.blocked,
    admitted: report.admitted,
    writer_violations: report.writer_violations,
    failed: report.failed
  }));
} else {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
