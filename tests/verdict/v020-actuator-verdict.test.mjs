import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { compileActuatorVerdict } from "../../src/verdict/compile-actuator-verdict.js";
import { verifySignedObject } from "../../src/signing/deterministic-local-signing.js";

function fixture(name) {
  return JSON.parse(fs.readFileSync(`fixtures/v020/candidates/${name}.example.json`, "utf8"));
}

test("clean projection compiles to signed report-only admissible verdict", () => {
  const verdict = compileActuatorVerdict(fixture("projection-clean"));

  assert.equal(verdict.verdict_type, "ADMISSORIUM_ACTUATOR_VERDICT");
  assert.equal(verdict.state, "ADMISSIBLE_REPORT_ONLY");
  assert.equal(verdict.risk, "GREEN");
  assert.equal(verdict.writer_enabled, false);
  assert.equal(verdict.webhook_enabled, false);
  assert.equal(verdict.check_run_writer_enabled, false);
  assert.equal(verdict.allowed_to_mutate_truth, false);
  assert.equal(verifySignedObject(verdict), true);
});

test("protected truth touch compiles to signed quarantine/block verdict", () => {
  const verdict = compileActuatorVerdict(fixture("protected-truth-touch"));

  assert.equal(verdict.state, "INADMISSIBLE_OR_QUARANTINE");
  assert.equal(verdict.risk, "RED");
  assert.equal(verdict.no_truth_mutation_path_pass, false);
  assert.ok(verdict.denied_actions.includes("rewrite_current_truth"));
  assert.equal(verifySignedObject(verdict), true);
});

test("package publish and secret persistence stay explicit failed pass fields", () => {
  const pkg = compileActuatorVerdict(fixture("package-publish"));
  const secret = compileActuatorVerdict(fixture("secret-bearing"));

  assert.equal(pkg.no_package_publish_path_pass, false);
  assert.equal(pkg.package_publish_enabled, false);
  assert.equal(secret.no_secret_persistence_pass, false);
  assert.equal(secret.contents_write_enabled, false);
});
