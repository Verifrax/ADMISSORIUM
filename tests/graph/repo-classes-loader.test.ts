import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import assert from "node:assert/strict";
import { loadRepoClassRegistry } from "../../graph/loaders/repo-classes-loader.js";

test("loads repository class registry from .github governance registry when present", () => {
  const root = mkdtempSync(join(tmpdir(), "admissorium-repo-class-registry-"));
  try {
    const governance = join(root, ".github", "governance");
    mkdirSync(governance, { recursive: true });
    writeFileSync(join(governance, "REPO_CLASSES.json"), JSON.stringify({
      schema: "verifrax.repo_classes.v1",
      count: 1,
      entries: [{
        repo: "Verifrax/ADMISSORIUM",
        class: "admissibility_enforcement_implementation",
        primary_role: "admission_gate_actuator"
      }]
    }));

    const loaded = loadRepoClassRegistry(root);

    assert.equal(loaded.present, true);
    assert.equal(loaded.entries.length, 1);
    assert.equal(loaded.entries[0]?.repo, "Verifrax/ADMISSORIUM");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("returns absent registry state when repository class registry is not materialized", () => {
  const root = mkdtempSync(join(tmpdir(), "admissorium-repo-class-registry-"));
  try {
    const loaded = loadRepoClassRegistry(root);

    assert.equal(loaded.present, false);
    assert.equal(loaded.entries.length, 0);
    assert.equal(loaded.source, "REPO_CLASSES_REGISTRY_ABSENT");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
