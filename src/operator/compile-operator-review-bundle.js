import { signObject } from "../signing/deterministic-local-signing.js";

export function compileOperatorReviewBundle(quarantineSuite, options = {}) {
  const generated_at = options.generated_at || quarantineSuite.generated_at || "1970-01-01T00:00:00.000Z";

  const cases = quarantineSuite.results.map((r) => ({
    candidate_id: r.candidate_id,
    file: r.file,
    risk: r.risk,
    verdict_state: r.verdict_state,
    quarantine_required: r.quarantine_required,
    quarantine_route: r.quarantine_route,
    repair_mode: r.repair_mode,
    quarantine_hash: r.quarantine?.canonical_hash,
    repair_packet_hash: r.repair_packet?.canonical_hash,
    operator_action: r.quarantine_required ? "REVIEW_PRIVATE_QUARANTINE" : "ACK_REPORT_ONLY_PASS"
  }));

  const bundle = {
    bundle_type: "ADMISSORIUM_OPERATOR_REVIEW_BUNDLE",
    schema_version: "1.0.0",
    generated_at,

    mode: "OPERATOR_REVIEW_ONLY",
    truth_warning: "NOT_TRUTH_SOURCE",
    non_sovereign_boundary: "ADMISSORIUM does not decide truth.",
    completion_warning: "This bundle does not make VERIFRAX_SYSTEM_COMPLETE true.",

    total: quarantineSuite.total,
    quarantined: quarantineSuite.quarantined,
    passed_without_quarantine: quarantineSuite.passed_without_quarantine,
    failed: quarantineSuite.failed,

    writer_enabled: false,
    webhook_enabled: false,
    check_run_writer_enabled: false,
    pr_writer_enabled: false,
    issue_writer_enabled: false,
    package_publish_enabled: false,
    contents_write_enabled: false,
    main_write_enabled: false,
    allowed_to_mutate_truth: false,

    allowed_operator_actions: [
      "read_bundle",
      "review_private_quarantine",
      "acknowledge_report_only_pass",
      "request_manual_followup_outside_admissorium"
    ],

    forbidden_automated_actions: [
      "open_issue",
      "open_pull_request",
      "write_check_run",
      "call_webhook",
      "push_branch",
      "write_main",
      "publish_package",
      "persist_secret",
      "mutate_truth",
      "decide_truth"
    ],

    cases
  };

  return signObject(bundle, options.signing_seed);
}
