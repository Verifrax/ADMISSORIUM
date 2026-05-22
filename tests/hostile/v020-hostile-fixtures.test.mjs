import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { evaluateHostileFixture } from "../../src/hostile/evaluate-hostile-fixture.js";

const fixtureDir = "fixtures/v020/hostile";
const files = fs.readdirSync(fixtureDir).filter((file) => file.endsWith(".json")).sort();

test("every hostile fixture is blocked and never admitted", () => {
  for (const file of files) {
    const fixture = JSON.parse(fs.readFileSync(path.join(fixtureDir, file), "utf8"));
    const result = evaluateHostileFixture(fixture);
    assert.equal(result.passed, true, `${file}: ${result.failures.join(",")}`);
    assert.equal(result.admitted, false, `${file} admitted`);
    assert.equal(result.risk, "RED", `${file} not RED`);
  }
});

test("hostile fixtures never enable writer or truth mutation flags", () => {
  for (const file of files) {
    const fixture = JSON.parse(fs.readFileSync(path.join(fixtureDir, file), "utf8"));
    const result = evaluateHostileFixture(fixture);
    assert.equal(result.writer_enabled, false, `${file} writer_enabled`);
    assert.equal(result.webhook_enabled, false, `${file} webhook_enabled`);
    assert.equal(result.check_run_writer_enabled, false, `${file} check_run_writer_enabled`);
    assert.equal(result.contents_write_enabled, false, `${file} contents_write_enabled`);
    assert.equal(result.allowed_to_mutate_truth, false, `${file} allowed_to_mutate_truth`);
  }
});

test("hostile fixture suite report is generated as PASS", async () => {
  const { spawnSync } = await import("node:child_process");
  const run = spawnSync(process.execPath, ["src/v020/run-hostile-fixtures.js"], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const report = JSON.parse(fs.readFileSync("reports/current/admissorium-v020-hostile-fixtures.json", "utf8"));
  assert.equal(report.state, "ADMISSORIUM_V020_HOSTILE_FIXTURES_PASS");
  assert.equal(report.admitted, 0);
  assert.equal(report.writer_violations, 0);
  assert.equal(report.failed, 0);
});
