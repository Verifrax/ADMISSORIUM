import assert from "node:assert/strict";
import test from "node:test";
import { readJson, validateObject } from "../../src/schema/validate-object.js";
import { validateV020Objects } from "../../src/schema/validate-v020-objects.js";

test("all v0.2.0 schemas and example objects validate", () => {
  const report = validateV020Objects();
  assert.equal(report.state, "ADMISSORIUM_V020_OBJECT_SCHEMAS_PASS");
  assert.equal(report.system_complete, false);
  assert.equal(report.writer_enabled, false);
  assert.equal(report.webhook_enabled, false);
  assert.equal(report.summary.failed, 0);
});

test("admission receipt remains non-sovereign", () => {
  const schema = readJson("schemas/admission-receipt.schema.json");
  const receipt = readJson("examples/admission-receipt.example.json");
  assert.deepEqual(validateObject(receipt, schema), []);
  assert.equal(receipt.truth_warning, "NOT_TRUTH_SOURCE");
  assert.ok(receipt.bounded_meaning.some(x => x.includes("does not define law")));
  assert.ok(receipt.bounded_meaning.some(x => x.includes("does not accept state")));
  assert.ok(receipt.bounded_meaning.some(x => x.includes("does not verify as final source")));
});

test("dry-run repair plan proves no protected truth path touch", () => {
  const schema = readJson("schemas/dry-run-repair-plan.schema.json");
  const plan = readJson("examples/dry-run-repair-plan.example.json");
  assert.deepEqual(validateObject(plan, schema), []);
  assert.equal(plan.mode, "DRY_RUN_ONLY");
  assert.equal(plan.truth_path_touched, false);
  assert.equal(plan.protected_path_touched, false);
  assert.equal(plan.projection_only_assertion, true);
  assert.equal(plan.requires_human_review, true);
});
