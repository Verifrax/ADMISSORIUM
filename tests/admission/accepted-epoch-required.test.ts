import test from "node:test";
import assert from "node:assert/strict";
import { assertAcceptedEpochRequired } from "../../src/admission/assert-accepted-epoch-required.js";

const classes = [
  "law-version",
  "freeze-object",
  "accepted-epoch",
  "authority-object",
  "execution-receipt",
  "verification-result",
  "recognition-object",
  "recourse-object",
  "continuity-transfer"
];

const counts = {
  governed_repository_count: 35,
  public_repository_count: 36,
  sovereign_chamber_count: 9,
  host_count: 12,
  npm_package_count: 18,
  core_package_order_count: 16,
  pypi_package_boundary_count: 1,
  private_internal_package_count: 1
};

const epoch = {
  object_type: "AcceptedEpoch",
  accepted_epoch_id: "accepted-epoch-0001",
  status: "ACTIVE_TRUTH",
  epoch_stage_count: 9,
  accepted_claim_classes: classes,
  accepted_counts: counts
};

const chainLock = {
  object_type: "MinimumObjectChainLock",
  status: "ACTIVE_TRUTH",
  accepted_epoch_ref: "https://github.com/Verifrax/ORBISTIUM/blob/main/epochs/current/accepted-epoch-0001.json",
  chain: classes.map((claim_class, index) => ({
    stage: index + 1,
    claim_class,
    status: "ACTIVE_TRUTH"
  }))
};

const admissions = {
  status: "ACTIVE_TRUTH",
  count_policy: counts
};

test("accepted epoch matches chain lock and admissions", () => {
  assert.deepEqual(assertAcceptedEpochRequired(epoch, chainLock, admissions), []);
});

test("epoch class drift is red", () => {
  const findings = assertAcceptedEpochRequired(
    { ...epoch, accepted_claim_classes: [...classes.slice(0, 8), "projection-continuity"] },
    chainLock,
    admissions
  );

  assert.equal(findings[0]?.severity, "RED");
  assert.equal(findings[0]?.code, "ACCEPTED_EPOCH_CHAIN_CLASS_MISMATCH");
});

test("epoch count drift is red", () => {
  const findings = assertAcceptedEpochRequired(
    { ...epoch, accepted_counts: { ...counts, governed_repository_count: 36 } },
    chainLock,
    admissions
  );

  assert.equal(findings[0]?.severity, "RED");
  assert.equal(findings[0]?.code, "ACCEPTED_EPOCH_COUNT_MISMATCH_GOVERNED_REPOSITORY_COUNT");
});

test("chain accepted epoch ref substitution is red", () => {
  const findings = assertAcceptedEpochRequired(
    epoch,
    { ...chainLock, accepted_epoch_ref: "https://github.com/Verifrax/ORBISTIUM/blob/main/epochs/current/accepted-epoch-0002.json" },
    admissions
  );

  assert.equal(findings[0]?.severity, "RED");
  assert.equal(findings[0]?.code, "CHAINLOCK_ACCEPTED_EPOCH_REF_MISMATCH");
});
