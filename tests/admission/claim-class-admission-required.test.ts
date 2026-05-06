import test from "node:test";
import assert from "node:assert/strict";
import { assertClaimClassAdmissionRequired } from "../../src/admission/assert-claim-class-admission-required.js";

const expected = [
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

const owners = [
  "SYNTAGMARIUM",
  "SYNTAGMARIUM",
  "ORBISTIUM",
  "AUCTORISEAL",
  "CORPIFORM",
  "VERIFRAX",
  "ANAGNORIUM",
  "REGRESSORIUM",
  "SYNTAGMARIUM"
];

const admission = {
  object_type: "ClaimClassAdmission",
  status: "ACTIVE_LAW",
  admitted_claim_classes: expected.map((claim_class, index) => ({
    order: index + 1,
    claim_class,
    owner: owners[index] ?? "VERIFRAX",
    required: true
  }))
};

const acceptedState = {
  object_type: "AcceptedClaimClassState",
  status: "ACTIVE_TRUTH",
  accepted_claim_classes: expected
};

const chainLock = {
  object_type: "MinimumObjectChainLock",
  status: "ACTIVE_TRUTH",
  chain: expected.map((claim_class, index) => ({
    stage: index + 1,
    claim_class,
    owner: owners[index] ?? "VERIFRAX",
    object_ref: `https://github.com/Verifrax/${owners[index] ?? "VERIFRAX"}/blob/main/current/${claim_class}.json`,
    status: "ACTIVE_TRUTH"
  }))
};

test("claim-class admission matches accepted state and chain lock", () => {
  assert.deepEqual(assertClaimClassAdmissionRequired(admission, acceptedState, chainLock), []);
});

test("projection-added claim class is red", () => {
  const findings = assertClaimClassAdmissionRequired(
    admission,
    { ...acceptedState, accepted_claim_classes: [...expected, "projection-only-class"] },
    chainLock
  );

  assert.equal(findings[0]?.severity, "RED");
  assert.equal(findings[0]?.code, "CLAIM_CLASS_LAW_STATE_MISMATCH");
});

test("chain lock substitution is red", () => {
  const badChain = {
    ...chainLock,
    chain: chainLock.chain.map((stage) =>
      stage.stage === 7 ? { ...stage, claim_class: "recognition-object-0002" } : stage
    )
  };

  const findings = assertClaimClassAdmissionRequired(admission, acceptedState, badChain);

  assert.equal(findings[0]?.severity, "RED");
  assert.equal(findings[0]?.code, "ACCEPTED_CLAIM_CLASS_CHAINLOCK_MISMATCH");
});

test("non-required admitted class is yellow", () => {
  const findings = assertClaimClassAdmissionRequired(
    {
      ...admission,
      admitted_claim_classes: admission.admitted_claim_classes.map((cls) =>
        cls.claim_class === "recourse-object" ? { ...cls, required: false } : cls
      )
    },
    acceptedState,
    chainLock
  );

  assert.equal(findings[0]?.severity, "YELLOW");
  assert.equal(findings[0]?.code, "CLAIM_CLASS_NOT_REQUIRED");
});
