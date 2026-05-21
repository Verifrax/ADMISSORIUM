import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { classifySurface } from "../../src/classify/surface-classifier.js";
import { classifyMutation } from "../../src/classify/mutation-classifier.js";
import { classifyTruthRisk } from "../../src/classify/truth-risk-classifier.js";

function fixture(name) {
  return JSON.parse(fs.readFileSync(`fixtures/v020/candidates/${name}.example.json`, "utf8"));
}

test("clean projection remains report-only", () => {
  const candidate = fixture("projection-clean");
  const surface = classifySurface(candidate);
  const mutation = classifyMutation(candidate, surface);
  const risk = classifyTruthRisk(candidate, surface, mutation);

  assert.equal(surface.surface_class, "PROJECTION_SURFACE");
  assert.equal(surface.truth_path_touched, false);
  assert.deepEqual(mutation.red_classes, []);
  assert.equal(risk.risk, "GREEN");
});

test("protected truth path is red", () => {
  const candidate = fixture("protected-truth-touch");
  const surface = classifySurface(candidate);
  const mutation = classifyMutation(candidate, surface);
  const risk = classifyTruthRisk(candidate, surface, mutation);

  assert.equal(surface.truth_path_touched, true);
  assert.ok(mutation.red_classes.includes("protected_truth_mutation"));
  assert.equal(risk.risk, "RED");
});

test("sovereign language is role collapse", () => {
  const candidate = fixture("sovereign-language");
  const surface = classifySurface(candidate);
  const mutation = classifyMutation(candidate, surface);
  const risk = classifyTruthRisk(candidate, surface, mutation);

  assert.equal(surface.sovereign_language_detected, true);
  assert.ok(mutation.red_classes.includes("role_collapse"));
  assert.equal(risk.risk, "RED");
});

test("package publish path is blocked", () => {
  const candidate = fixture("package-publish");
  const surface = classifySurface(candidate);
  const mutation = classifyMutation(candidate, surface);
  const risk = classifyTruthRisk(candidate, surface, mutation);

  assert.ok(mutation.red_classes.includes("package_publish_path"));
  assert.equal(risk.no_package_publish_path_pass, false);
});

test("secret-bearing artifact is blocked", () => {
  const candidate = fixture("secret-bearing");
  const surface = classifySurface(candidate);
  const mutation = classifyMutation(candidate, surface);
  const risk = classifyTruthRisk(candidate, surface, mutation);

  assert.ok(mutation.red_classes.includes("secret_bearing_artifact"));
  assert.equal(risk.no_secret_persistence_pass, false);
});
