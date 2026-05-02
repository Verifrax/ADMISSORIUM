import crypto from "node:crypto";

export type ActuatorVerdictInput = {
  repo: string;
  paths: string[];
  decision: string;
};

export function compileActuatorVerdict(input: ActuatorVerdictInput) {
  const body = {
    verdict_type: "ADMISSORIUM_ACTUATOR_VERDICT",
    schema_version: "1.0.0",
    admissorium_version: "0.2.0",
    run_id: `admissorium-${new Date().toISOString()}`,
    truth_warning: "NOT_TRUTH_SOURCE",
    subject: {
      repo: input.repo,
      paths: input.paths
    },
    decision: input.decision,
    forbidden_actions_confirmed_absent: [
      "truth_mutation",
      "direct_main_write",
      "package_publish",
      "secret_access",
      "authority_issuance",
      "execution_receipt_emission",
      "verification_finality_claim",
      "recognition_claim",
      "recourse_claim"
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
