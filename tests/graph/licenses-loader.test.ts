import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import assert from "node:assert/strict";
import { loadLicenseRegistry } from "../../graph/loaders/licenses-loader.js";

test("loads license registry from .github governance registry when present", () => {
  const root = mkdtempSync(join(tmpdir(), "admissorium-license-registry-"));
  try {
    const governance = join(root, ".github", "governance");
    mkdirSync(governance, { recursive: true });
    writeFileSync(join(governance, "LICENSES.json"), JSON.stringify({
      schema: "verifrax.licenses.v1",
      count: 1,
      entries: [{
        repo: "Verifrax/ADMISSORIUM",
        license: "Apache-2.0",
        license_file_required: true,
        readme_license_required: true,
        package_json_license_required_if_present: true
      }]
    }));

    const loaded = loadLicenseRegistry(root);

    assert.equal(loaded.present, true);
    assert.equal(loaded.entries.length, 1);
    assert.equal(loaded.entries[0]?.repo, "Verifrax/ADMISSORIUM");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("returns absent registry state when license registry is not materialized", () => {
  const root = mkdtempSync(join(tmpdir(), "admissorium-license-registry-"));
  try {
    const loaded = loadLicenseRegistry(root);

    assert.equal(loaded.present, false);
    assert.equal(loaded.entries.length, 0);
    assert.equal(loaded.source, "LICENSES_REGISTRY_ABSENT");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
