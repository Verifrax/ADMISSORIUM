const RED_MUTATION_CLASSES = new Set([
  "protected_truth_mutation",
  "contents_write_request",
  "direct_main_write_attempt",
  "package_publish_path",
  "secret_bearing_artifact",
  "role_collapse"
]);

export function classifyTruthRisk(candidate, surface, mutation) {
  const redClasses = new Set(mutation.red_classes || []);
  const reasons = [];

  if (surface.truth_path_touched) reasons.push("protected_truth_path_touched");
  if (surface.sovereign_language_detected) reasons.push("sovereign_language_detected");

  for (const cls of redClasses) {
    if (RED_MUTATION_CLASSES.has(cls)) reasons.push(cls);
  }

  const noTruthMutationPathPass =
    !surface.truth_path_touched &&
    !redClasses.has("protected_truth_mutation");

  const noDirectMainWritePass =
    !redClasses.has("direct_main_write_attempt");

  const noPackagePublishPathPass =
    !redClasses.has("package_publish_path");

  const noSecretPersistencePass =
    !redClasses.has("secret_bearing_artifact");

  const risk = reasons.length > 0 ? "RED" : "GREEN";

  return {
    classifier: "ADMISSORIUM_TRUTH_RISK_CLASSIFIER",
    schema_version: "1.0.0",
    truth_warning: "NOT_TRUTH_SOURCE",

    writer_enabled: false,
    webhook_enabled: false,
    check_run_writer_enabled: false,
    package_publish_enabled: false,
    contents_write_enabled: false,
    allowed_to_mutate_truth: false,

    no_truth_mutation_path_pass: noTruthMutationPathPass,
    no_direct_main_write_pass: noDirectMainWritePass,
    no_package_publish_path_pass: noPackagePublishPathPass,
    no_secret_persistence_pass: noSecretPersistencePass,

    risk,
    reasons,
    candidate_id: candidate.id || candidate.name || null
  };
}
