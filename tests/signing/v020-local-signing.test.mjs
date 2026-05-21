import assert from "node:assert/strict";
import test from "node:test";
import { signObject, verifySignedObject } from "../../src/signing/deterministic-local-signing.js";

test("local signing is deterministic and explicitly non-production", () => {
  const object = { b: 2, a: 1 };
  const first = signObject(object);
  const second = signObject(object);

  assert.equal(first.signature, second.signature);
  assert.equal(first.signature_algorithm, "HMAC-SHA256-LOCAL-DETERMINISTIC-STUB");
  assert.ok(first.signer_key_ref.startsWith("local-test-key:"));
  assert.equal(verifySignedObject(first), true);
});

test("changed object fails signature replay", () => {
  const signed = signObject({ state: "GREEN" });
  signed.state = "RED";
  assert.equal(verifySignedObject(signed), false);
});
