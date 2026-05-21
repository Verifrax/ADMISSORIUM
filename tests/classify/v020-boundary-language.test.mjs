import assert from "node:assert/strict";
import test from "node:test";
import { classifySurface } from "../../src/classify/surface-classifier.js";
import { classifyMutation } from "../../src/classify/mutation-classifier.js";
import { classifyTruthRisk } from "../../src/classify/truth-risk-classifier.js";

test("negated truth-boundary language is safe", () => {
  const candidate = {
    repo: "Verifrax/VERIFRAX-WWW",
    summary: "clarify that root router is not accepted truth and not a source of truth",
    files: [
      { path: "docs/system-boundary.md", change: "Root router does not decide truth and does not accept state." }
    ]
  };

  const surface = classifySurface(candidate);
  const mutation = classifyMutation(candidate, surface);
  const risk = classifyTruthRisk(candidate, surface, mutation);

  assert.equal(surface.sovereign_language_detected, false);
  assert.equal(surface.surface_class, "PROJECTION_SURFACE");
  assert.deepEqual(mutation.red_classes, []);
  assert.equal(risk.risk, "GREEN");
});

test("positive sovereign claim still blocks", () => {
  const candidate = {
    repo: "Verifrax/ADMISSORIUM",
    summary: "bad claim",
    files: [
      { path: "README.md", change: "ADMISSORIUM decides truth and is the source of truth." }
    ]
  };

  const surface = classifySurface(candidate);
  const mutation = classifyMutation(candidate, surface);
  const risk = classifyTruthRisk(candidate, surface, mutation);

  assert.equal(surface.sovereign_language_detected, true);
  assert.ok(mutation.red_classes.includes("role_collapse"));
  assert.equal(risk.risk, "RED");
});
