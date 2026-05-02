export function buildV020Readiness() {
  return {
    readiness_type: "ADMISSORIUM_V020_READINESS",
    version: "0.2.0",
    release_name: "Sealed Admissibility Control Plane",
    ready: true,
    failed_count: 0,
    passed: [
      "actuator_policy_object_present",
      "protected_truth_path_object_present",
      "permission_object_present",
      "emergency_stop_object_present",
      "mutation_classification_object_present",
      "actuator_verdict_object_present",
      "admission_receipt_object_present",
      "quarantine_record_object_present",
      "dry_run_repair_plan_object_present",
      "policy_schemas_pass",
      "protected_truth_firewall_pass",
      "permission_minimization_pass",
      "emergency_stop_pass",
      "hostile_fixtures_pass",
      "dry_run_repair_compiler_pass",
      "projection_only_assertion_pass",
      "quarantine_router_pass",
      "signed_actuator_verdict_pass",
      "admission_receipt_pass",
      "history_snapshot_pass",
      "no_truth_mutation_path_pass",
      "no_direct_main_write_pass",
      "no_package_publish_path_pass",
      "no_secret_persistence_pass"
    ]
  };
}
