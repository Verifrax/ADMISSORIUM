import crypto from "node:crypto";

export function compileAdmissionReceipt(decision: string) {
  const body = {
    receipt_type: "ADMISSORIUM_ADMISSION_RECEIPT",
    schema_version: "1.0.0",
    receipt_id: `adm-v020-${new Date().toISOString()}`,
    truth_warning: "NOT_TRUTH_SOURCE",
    decision,
    bounded_meaning: [
      "This receipt proves admissibility evaluation only.",
      "It does not define law.",
      "It does not accept state.",
      "It does not issue authority.",
      "It does not execute.",
      "It does not verify as final source.",
      "It does not recognize terminal truth.",
      "It does not assign recourse."
    ]
  };
  return {
    ...body,
    signature: {
      algorithm: "sha256-local-test-stub",
      key_id: "local-test",
      signature: crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex")
    }
  };
}
