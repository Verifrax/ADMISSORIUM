import test from "node:test";
import assert from "node:assert/strict";
import { assertAdmissionCountConvergence } from "../../src/admission/assert-admission-count-convergence.js";
import {
  assertChainlockProjectionConvergence,
  type ChainLockObject
} from "../../src/admission/assert-chainlock-projection-convergence.js";

const admissions = {
  schema: "verifrax.admissions.v1",
  status: "ACTIVE_TRUTH",
  count_policy: {
    governed_repository_count: 35,
    public_repository_count: 36,
    sovereign_chamber_count: 9,
    host_count: 12,
    npm_package_count: 18,
    core_package_order_count: 16,
    pypi_package_boundary_count: 1,
    private_internal_package_count: 1
  }
};

const chainLock: ChainLockObject = {
  object_type: "MinimumObjectChainLock",
  chain_lock_id: "minimum-object-chain-lock-0001",
  status: "ACTIVE_TRUTH",
  chain: [
    {
      stage: 1,
      claim_class: "law-version",
      owner: "SYNTAGMARIUM",
      object_ref: "https://github.com/Verifrax/SYNTAGMARIUM/blob/main/law/versions/current/law-version-0001.json",
      status: "ACTIVE_TRUTH"
    },
    {
      stage: 2,
      claim_class: "freeze-object",
      owner: "SYNTAGMARIUM",
      object_ref: "https://github.com/Verifrax/SYNTAGMARIUM/blob/main/freeze/objects/current/freeze-object-0001.json",
      status: "ACTIVE_TRUTH"
    },
    {
      stage: 3,
      claim_class: "accepted-epoch",
      owner: "ORBISTIUM",
      object_ref: "https://github.com/Verifrax/ORBISTIUM/blob/main/epochs/current/accepted-epoch-0001.json",
      status: "ACTIVE_TRUTH"
    },
    {
      stage: 4,
      claim_class: "authority-object",
      owner: "AUCTORISEAL",
      object_ref: "https://github.com/Verifrax/AUCTORISEAL/blob/main/authorities/current/authority-object-0001.json",
      status: "ACTIVE_TRUTH"
    },
    {
      stage: 5,
      claim_class: "execution-receipt",
      owner: "CORPIFORM",
      object_ref: "https://github.com/Verifrax/CORPIFORM/blob/main/receipts/current/execution-receipt-0001.json",
      status: "ACTIVE_TRUTH"
    },
    {
      stage: 6,
      claim_class: "verification-result",
      owner: "VERIFRAX",
      object_ref: "https://github.com/Verifrax/VERIFRAX/blob/main/verification/results/current/verification-result-0001.json",
      status: "ACTIVE_TRUTH"
    },
    {
      stage: 7,
      claim_class: "recognition-object",
      owner: "ANAGNORIUM",
      object_ref: "https://github.com/Verifrax/ANAGNORIUM/blob/main/recognitions/current/recognition-object-0001.json",
      status: "ACTIVE_TRUTH"
    },
    {
      stage: 8,
      claim_class: "recourse-object",
      owner: "REGRESSORIUM",
      object_ref: "https://github.com/Verifrax/REGRESSORIUM/blob/main/claims/current/recourse-object-0001.json",
      status: "ACTIVE_TRUTH"
    },
    {
      stage: 9,
      claim_class: "continuity-transfer",
      owner: "SYNTAGMARIUM",
      object_ref: "https://github.com/Verifrax/SYNTAGMARIUM/blob/main/continuity/objects/current/continuity-transfer-0001.json",
      status: "ACTIVE_TRUTH"
    }
  ]
};

test("admission count convergence passes for split counts", () => {
  const findings = assertAdmissionCountConvergence(admissions, {
    governed_repository_count: 35,
    public_repository_count: 36,
    sovereign_chamber_count: 9,
    host_count: 12,
    npm_package_count: 18,
    core_package_order_count: 16,
    pypi_package_boundary_count: 1,
    private_internal_package_count: 1
  });

  assert.deepEqual(findings, []);
});

test("repo label collapse is yellow when public and governed counts are not distinguished", () => {
  const findings = assertAdmissionCountConvergence(admissions, {
    label: "36 repos live",
    public_repository_count: 36
  });

  assert.equal(findings.length, 1);
  const finding = findings[0];
  assert.ok(finding);
  assert.equal(finding.severity, "YELLOW");
  assert.equal(finding.code, "REPOSITORY_LABEL_COLLAPSES_PUBLIC_AND_GOVERNED");
});

test("wrong governed repository count is red", () => {
  const findings = assertAdmissionCountConvergence(admissions, {
    governed_repository_count: 36
  });

  assert.equal(findings.length, 1);
  const finding = findings[0];
  assert.ok(finding);
  assert.equal(finding.severity, "RED");
  assert.equal(finding.code, "COUNT_MISMATCH_GOVERNED_REPOSITORY_COUNT");
});

test("chainlock projection convergence passes for locked stage count", () => {
  const findings = assertChainlockProjectionConvergence(chainLock, {
    chain_stage_count: 9,
    chain_object_refs: chainLock.chain.map((stage) => stage.object_ref)
  });

  assert.deepEqual(findings, []);
});

test("chain object substitution is red", () => {
  const findings = assertChainlockProjectionConvergence(chainLock, {
    chain_stage_count: 9,
    chain_object_refs: ["https://github.com/Verifrax/ANAGNORIUM/blob/main/recognitions/current/recognition-object-0002.json"]
  });

  assert.equal(findings.length, 1);
  const finding = findings[0];
  assert.ok(finding);
  assert.equal(finding.severity, "RED");
  assert.equal(finding.code, "PROJECTION_CHAIN_OBJECT_SUBSTITUTION");
});
