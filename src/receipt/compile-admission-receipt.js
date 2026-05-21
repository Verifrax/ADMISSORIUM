import { objectDigest, signObject } from "../signing/deterministic-local-signing.js";

export function compileAdmissionReceipt(verdict, options = {}) {
  const receipt = {
    receipt_type: "ADMISSORIUM_ADMISSION_RECEIPT",
    schema_version: "1.0.0",
    generated_at: options.generated_at || verdict.generated_at || "1970-01-01T00:00:00.000Z",

    candidate_id: verdict.candidate_id,
    verdict_hash: objectDigest(verdict),
    verdict_state: verdict.state,
    risk: verdict.risk,

    admission: verdict.state === "ADMISSIBLE_REPORT_ONLY" ? "REPORT_ONLY_ADMISSION" : "NOT_ADMITTED",
    truth_warning: "NOT_TRUTH_SOURCE",
    non_sovereign_boundary: "ADMISSORIUM does not decide truth.",

    writer_enabled: false,
    webhook_enabled: false,
    check_run_writer_enabled: false,
    package_publish_enabled: false,
    contents_write_enabled: false,
    main_write_enabled: false,
    allowed_to_mutate_truth: false,

    no_truth_mutation_path_pass: verdict.no_truth_mutation_path_pass,
    no_direct_main_write_pass: verdict.no_direct_main_write_pass,
    no_package_publish_path_pass: verdict.no_package_publish_path_pass,
    no_secret_persistence_pass: verdict.no_secret_persistence_pass
  };

  return signObject(receipt, options.signing_seed);
}
