import { signObject } from "../signing/deterministic-local-signing.js";

export function routeQuarantine(verdict, receipt, options = {}) {
  const blocked = verdict.state !== "ADMISSIBLE_REPORT_ONLY";

  const record = {
    record_type: "ADMISSORIUM_QUARANTINE_RECORD",
    schema_version: "1.0.0",
    generated_at: options.generated_at || verdict.generated_at || "1970-01-01T00:00:00.000Z",

    candidate_id: verdict.candidate_id,
    verdict_state: verdict.state,
    receipt_admission: receipt.admission,
    risk: verdict.risk,

    quarantine_required: blocked,
    route: blocked ? "PRIVATE_REVIEW_QUARANTINE" : "NO_QUARANTINE_REPORT_ONLY",
    queue: blocked ? "admissorium/v020/private-review" : "admissorium/v020/report-only-pass",

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

    allowed_actions: blocked
      ? ["emit_report", "emit_quarantine_record", "emit_dry_run_repair_plan"]
      : ["emit_report", "emit_no_quarantine_record"],

    denied_actions: [
      "open_issue",
      "open_pull_request",
      "write_check_run",
      "call_webhook",
      "direct_main_write",
      "contents_write",
      "package_publish",
      "persist_secret",
      "mutate_truth",
      "decide_truth"
    ],

    reasons: verdict.truth_risk?.reasons || [],
    red_classes: verdict.mutation?.red_classes || [],

    verdict_hash: verdict.canonical_hash,
    receipt_hash: receipt.canonical_hash
  };

  return signObject(record, options.signing_seed);
}
