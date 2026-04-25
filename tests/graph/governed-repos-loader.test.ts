import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import assert from "node:assert/strict";
import { loadGovernedRepos } from "../../graph/loaders/governed-repos-loader.js";

test("loads governed repositories from .github governance registry when present", () => {
  const root = mkdtempSync(join(tmpdir(), "admissorium-governed-repos-"));
  try {
    const governance = join(root, ".github", "governance");
    mkdirSync(governance, { recursive: true });
    writeFileSync(join(governance, "GOVERNED_REPOS.txt"), "Verifrax/.github\nVerifrax/ADMISSORIUM\n");

    const loaded = loadGovernedRepos(root);

    assert.equal(loaded.used_bootstrap, false);
    assert.deepEqual(loaded.repos, ["Verifrax/.github", "Verifrax/ADMISSORIUM"]);
    assert.match(loaded.source, /GOVERNED_REPOS\.txt$/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("uses bootstrap governed repository list when registry is not materialized", () => {
  const root = mkdtempSync(join(tmpdir(), "admissorium-governed-repos-"));
  try {
    const loaded = loadGovernedRepos(root);

    assert.equal(loaded.used_bootstrap, true);
    assert.equal(loaded.repos.length, 35);
    assert.ok(loaded.repos.includes("Verifrax/ADMISSORIUM"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
