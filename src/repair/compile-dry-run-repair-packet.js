import { signObject } from "../signing/deterministic-local-signing.js";

export function compileDryRunRepairPacket(verdict, receipt, quarantine, options = {}) {
  const blocked = verdict.state !== "ADMISSIBLE_REPORT_ONLY";

  const packet = {
    packet_type: "ADMISSORIUM_DRY_RUN_REPAIR_PACKET",
    schema_version: "1.0.0",
    generated_at: options.generated_at || verdict.generated_at || "1970-01-01T00:00:00.000Z",

    candidate_id: verdict.candidate_id,
    verdict_state: verdict.state,
    quarantine_route: quarantine.route,
    repair_mode: "DRY_RUN_ONLY",

    truth_warning: "NOT_TRUTH_SOURCE",
    non_sovereign_boundary: "ADMISSORIUM does not decide truth.",

    writer_enabled: false,
    webhook_enabled: false,
    check_run_writer_enabled: false,
    pr_writer_enabled: false,
    issue_writer_enabled: false,
    package_publish_enabled: false,
    contents_write_enabled: false,
    main_write_enabled: false,
    allowed_to_mutate_truth: false,

    proposed_actions: blocked
      ? [
          "produce private review report",
          "explain blocked classes",
          "produce human-readable remediation notes",
          "do not write repository state"
        ]
      : [
          "preserve report-only admission",
          "do not create writer side effects"
        ],

    forbidden_actions: [
      "open_issue",
      "open_pull_request",
      "write_check_run",
      "call_webhook",
      "push_branch",
      "write_main",
      "publish_package",
      "persist_secret",
      "mutate_truth"
    ],

    no_truth_mutation_path_pass: verdict.no_truth_mutation_path_pass,
    no_direct_main_write_pass: verdict.no_direct_main_write_pass,
    no_package_publish_path_pass: verdict.no_package_publish_path_pass,
    no_secret_persistence_pass: verdict.no_secret_persistence_pass,

    verdict_hash: verdict.canonical_hash,
    receipt_hash: receipt.canonical_hash,
    quarantine_hash: quarantine.canonical_hash
  };

  return signObject(packet, options.signing_seed);
}
