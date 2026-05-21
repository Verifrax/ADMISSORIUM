import crypto from "node:crypto";
import { canonicalJson } from "./canonical-json.js";

export const LOCAL_SIGNING_ALGORITHM = "HMAC-SHA256-LOCAL-DETERMINISTIC-STUB";
export const DEFAULT_LOCAL_SIGNING_SEED = "ADMISSORIUM_LOCAL_DETERMINISTIC_TEST_KEY_ONLY_NOT_PRODUCTION";

export function localKeyRef(seed = DEFAULT_LOCAL_SIGNING_SEED) {
  return "local-test-key:" + crypto.createHash("sha256").update(seed).digest("hex").slice(0, 24);
}

export function objectDigest(object) {
  return crypto.createHash("sha256").update(canonicalJson(object)).digest("hex");
}

export function signObject(object, seed = DEFAULT_LOCAL_SIGNING_SEED) {
  const unsigned = structuredClone(object);
  delete unsigned.signature;
  delete unsigned.signature_algorithm;
  delete unsigned.signer_key_ref;
  delete unsigned.canonical_hash;

  const canonical_hash = objectDigest(unsigned);
  const signature = crypto.createHmac("sha256", seed).update(canonical_hash).digest("hex");

  return {
    ...unsigned,
    canonical_hash,
    signature_algorithm: LOCAL_SIGNING_ALGORITHM,
    signer_key_ref: localKeyRef(seed),
    signature
  };
}

export function verifySignedObject(signed, seed = DEFAULT_LOCAL_SIGNING_SEED) {
  const expected = signObject(signed, seed);
  return (
    signed.signature_algorithm === expected.signature_algorithm &&
    signed.signer_key_ref === expected.signer_key_ref &&
    signed.canonical_hash === expected.canonical_hash &&
    signed.signature === expected.signature
  );
}
