import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import assert from "node:assert/strict";
import { loadPackageRegistry, packageName, packageSourceRepo } from "../../graph/loaders/packages-loader.js";

test("loads package registry from .github governance registry when present", () => {
  const root = mkdtempSync(join(tmpdir(), "admissorium-package-registry-"));
  try {
    const governance = join(root, ".github", "governance");
    mkdirSync(governance, { recursive: true });
    writeFileSync(join(governance, "PACKAGES.json"), JSON.stringify({
      schema: "verifrax.packages.v1",
      count: 1,
      entries: [{
        package: "@verifrax/admissorium",
        repo: "Verifrax/ADMISSORIUM",
        class: "implementation-tooling-package"
      }]
    }));

    const loaded = loadPackageRegistry(root);

    assert.equal(loaded.present, true);
    assert.equal(loaded.entries.length, 1);
    assert.equal(packageName(loaded.entries[0]!), "@verifrax/admissorium");
    assert.equal(packageSourceRepo(loaded.entries[0]!), "Verifrax/ADMISSORIUM");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("returns absent registry state when package registry is not materialized", () => {
  const root = mkdtempSync(join(tmpdir(), "admissorium-package-registry-"));
  try {
    const loaded = loadPackageRegistry(root);

    assert.equal(loaded.present, false);
    assert.equal(loaded.entries.length, 0);
    assert.equal(loaded.source, "PACKAGES_REGISTRY_ABSENT");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
