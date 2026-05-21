import { classifySurface } from "../classify/surface-classifier.js";
import { classifyMutation } from "../classify/mutation-classifier.js";
import { classifyTruthRisk } from "../classify/truth-risk-classifier.js";
import { signObject } from "../signing/deterministic-local-signing.js";

export function compileActuatorVerdict(candidate, options = {}) {
  const surface = classifySurface(candidate);
  const mutation = classifyMutation(candidate, surface);
  const risk = classifyTruthRisk(candidate, surface, mutation);

  const blocked = risk.risk !== "GREEN";
  const verdict = {
    verdict_type: "ADMISSORIUM_ACTUATOR_VERDICT",
    schema_version: "1.0.0",
    generated_at: options.generated_at || "1970-01-01T00:00:00.000Z",
    candidate_id: candidate.id || candidate.candidate_id || candidate.name || "candidate-unknown",

    mode: "REPORT_ONLY",
    state: blocked ? "INADMISSIBLE_OR_QUARANTINE" : "ADMISSIBLE_REPORT_ONLY",
    risk: risk.risk,
    decision_pressure: blocked ? "BLOCK_OR_QUARANTINE" : "REPORT_ONLY",

    truth_warning: "NOT_TRUTH_SOURCE",
    non_sovereign_boundary: "ADMISSORIUM does not decide truth.",
    allowed_to_mutate_truth: false,
    writer_enabled: false,
    webhook_enabled: false,
    check_run_writer_enabled: false,
    package_publish_enabled: false,
    contents_write_enabled: false,
    main_write_enabled: false,

    allowed_actions: blocked ? ["emit_report", "emit_quarantine_record"] : ["emit_report"],
    denied_actions: [
      "decide_truth",
      "rewrite_law",
      "rewrite_current_truth",
      "direct_main_write",
      "contents_write",
      "package_publish",
      "secret_persistence",
      "webhook_side_effect",
      "check_run_writer"
    ],

    no_truth_mutation_path_pass: risk.no_truth_mutation_path_pass,
    no_direct_main_write_pass: risk.no_direct_main_write_pass,
    no_package_publish_path_pass: risk.no_package_publish_path_pass,
    no_secret_persistence_pass: risk.no_secret_persistence_pass,

    surface,
    mutation,
    truth_risk: risk
  };

  return signObject(verdict, options.signing_seed);
}
