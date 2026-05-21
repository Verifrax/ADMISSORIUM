import assert from "node:assert/strict";
import test from "node:test";
import { classifySurface } from "../../src/classify/surface-classifier.js";
import { classifyMutation } from "../../src/classify/mutation-classifier.js";

test("json key path does not trigger PAT secret detection", () => {
  const candidate = {
    repo: "Verifrax/VERIFRAX-WWW",
    summary: "ordinary projection repair",
    files: [
      { path: "docs/system-boundary.md", change: "clarify boundary wording" }
    ]
  };

  const surface = classifySurface(candidate);
  const mutation = classifyMutation(candidate, surface);

  assert.equal(surface.surface_class, "PROJECTION_SURFACE");
  assert.deepEqual(mutation.red_classes, []);
});

test("real PAT token wording still triggers secret-bearing artifact", () => {
  const candidate = {
    repo: "Verifrax/ADMISSORIUM",
    summary: "bad secret fixture",
    files: [
      { path: "fixtures/app.env", change: "PAT example personal access token" }
    ]
  };

  const surface = classifySurface(candidate);
  const mutation = classifyMutation(candidate, surface);

  assert.ok(mutation.red_classes.includes("secret_bearing_artifact"));
});
