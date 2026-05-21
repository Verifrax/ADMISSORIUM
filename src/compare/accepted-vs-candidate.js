export function compareAcceptedVsCandidate(accepted, candidate, surface, mutation, truthRisk) {
  const acceptedRepos = new Set((accepted.repos || []).map(r => r.name));
  const repo_known = acceptedRepos.has(candidate.repo);

  const contradiction = [];

  if (!repo_known) contradiction.push("repo_not_in_accepted_graph");
  if (surface.truth_path_touched) contradiction.push("protected_truth_path_mutation");
  if (surface.sovereign_language_detected) contradiction.push("sovereign_language_projection");
  if (mutation.red_classes.length) contradiction.push("red_mutation_class_present");
  if (truthRisk.risk === "RED") contradiction.push("red_truth_risk");

  let verdict = "ADMISSIBLE_REPORT_ONLY";
  if (contradiction.length) verdict = "INADMISSIBLE_OR_QUARANTINE";

  return {
    comparator: "ADMISSORIUM_ACCEPTED_VS_CANDIDATE_COMPARATOR",
    schema_version: "1.0.0",
    writer_enabled: false,
    webhook_enabled: false,
    check_run_writer_enabled: false,
    package_publish_enabled: false,
    contents_write_enabled: false,
    allowed_to_mutate_truth: false,
    truth_warning: "NOT_TRUTH_SOURCE",
    repo_known,
    verdict,
    contradiction,
    merge_allowed: verdict === "ADMISSIBLE_REPORT_ONLY",
    repair_allowed: verdict === "ADMISSIBLE_REPORT_ONLY" && surface.projection_path_touched,
    repair_mode: "DRY_RUN_ONLY",
    writer_enabled: false,
    webhook_enabled: false,
    direct_main_write_enabled: false,
    package_publish_enabled: false
  };
}
