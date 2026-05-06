import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { assertAuthorityFreezeRequired } from "../../src/admission/assert-authority-freeze-required.js";

const base = {
  freezeObject: {
    object_type: "FreezeObject",
    freeze_object_id: "freeze-object-0001",
    status: "ACTIVE_TRUTH",
  },
  authorityObject: {
    object_type: "AuthorityObject",
    authority_object_id: "authority-object-0001",
    status: "ACTIVE_TRUTH",
    freeze_object_ref: "https://github.com/Verifrax/SYNTAGMARIUM/blob/main/freeze/objects/current/freeze-object-0001.json",
    accepted_epoch_ref: "https://github.com/Verifrax/ORBISTIUM/blob/main/epochs/current/accepted-epoch-0001.json",
    chain_lock_ref: "https://github.com/Verifrax/ORBISTIUM/blob/main/chains/current/minimum-object-chain-lock-0001.json",
    may_issue_authority_for_scope: true,
    may_mutate_law: false,
    may_mutate_accepted_state: false,
    may_mutate_freeze_object: false,
    may_infer_missing_truth: false,
  },
  acceptedEpoch: {
    accepted_epoch_id: "accepted-epoch-0001",
    status: "ACTIVE_TRUTH",
  },
  chainLock: {
    chain_lock_id: "minimum-object-chain-lock-0001",
    status: "ACTIVE_TRUTH",
  },
};

test("authority freeze required passes for active freeze and authority objects", () => {
  const report = assertAuthorityFreezeRequired(base);
  assert.equal(report.status, "PASS");
  assert.equal(report.truthWarning, "ADMISSORIUM_NOT_TRUTH_SOURCE");
  assert.equal(report.findings.length, 0);
});

test("authority freeze substitution is red", () => {
  const hostile = JSON.parse(
    readFileSync("tests/fixtures/hostile/authority-freeze-substitution.json", "utf8"),
  );
  const report = assertAuthorityFreezeRequired({
    ...base,
    authorityObject: { ...base.authorityObject, ...hostile },
  });
  assert.equal(report.status, "FAIL");
  assert.ok(report.findings.some((f) => f.code === "AUTHORITY_FREEZE_REF_SUBSTITUTED"));
});

test("authority role overclaim is red", () => {
  const hostile = JSON.parse(
    readFileSync("tests/fixtures/hostile/authority-role-overclaim.json", "utf8"),
  );
  const report = assertAuthorityFreezeRequired({
    ...base,
    authorityObject: { ...base.authorityObject, ...hostile },
  });
  assert.equal(report.status, "FAIL");
  assert.ok(report.findings.some((f) => f.code === "AUTHORITY_ROLE_OVERCLAIM"));
});

test("chain lock substitution is red", () => {
  const report = assertAuthorityFreezeRequired({
    ...base,
    authorityObject: {
      ...base.authorityObject,
      chain_lock_ref: "https://github.com/Verifrax/ORBISTIUM/blob/main/chains/current/other-chain-lock.json",
    },
  });
  assert.equal(report.status, "FAIL");
  assert.ok(report.findings.some((f) => f.code === "AUTHORITY_CHAIN_LOCK_REF_SUBSTITUTED"));
});
