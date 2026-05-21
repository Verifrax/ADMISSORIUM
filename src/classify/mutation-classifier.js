import { dangerText, hasAnyDangerPhrase } from "./language-boundary.js";

function hasSecretSignal(text) {
  return [
    /\bgithub\s+token\b/,
    /\bprivate\s+key\b/,
    /\bwebhook[_\s-]?secret\b/,
    /\bpat\b/,
    /\bpersonal\s+access\s+token\b/
  ].some(rx => rx.test(text));
}

export function classifyMutation(candidate, surface) {
  const files = candidate.files || [];
  const paths = files.map(f => f.path);
  const text = dangerText(candidate);

  const classes = [];

  if (surface.truth_path_touched) classes.push("protected_truth_mutation");
  if (surface.projection_path_touched) classes.push("projection_repair");
  if (surface.package_path_touched) classes.push("package_boundary_mutation");
  if (surface.workflow_path_touched) classes.push("workflow_boundary_mutation");

  if (text.includes("contents: write") || text.includes("contents_write") || text.includes("contents write")) {
    classes.push("contents_write_request");
  }

  if (text.includes("packages: write") || text.includes("package publish") || text.includes("npm publish")) {
    classes.push("package_publish_path");
  }

  if (hasSecretSignal(text)) {
    classes.push("secret_bearing_artifact");
  }

  if (hasAnyDangerPhrase(candidate, ["decides truth", "source of truth", "accepted truth"])) {
    classes.push("role_collapse");
  }

  if (!classes.length) classes.push("ordinary_materialization");

  const red_classes = classes.filter(c => [
    "protected_truth_mutation",
    "contents_write_request",
    "package_publish_path",
    "secret_bearing_artifact",
    "role_collapse"
  ].includes(c));

  return {
    classifier: "ADMISSORIUM_MUTATION_CLASSIFIER",
    schema_version: "1.0.0",
    truth_warning: "NOT_TRUTH_SOURCE",
    writer_enabled: false,
    webhook_enabled: false,
    check_run_writer_enabled: false,
    package_publish_enabled: false,
    contents_write_enabled: false,
    allowed_to_mutate_truth: false,
    classes,
    red_classes,
    decision_pressure: red_classes.length ? "BLOCK_OR_QUARANTINE" : "REPORT_ONLY",
    paths,
    writer_enabled: false,
    webhook_enabled: false
  };
}
