import { signObject } from "../signing/deterministic-local-signing.js";

function noWriterEnvelope(kind, candidate, payload, generated_at) {
  return signObject({
    packet_type: "ADMISSORIUM_TEST_MODE_WRITER_INTENT",
    schema_version: "1.0.0",
    generated_at,
    kind,
    candidate_id: candidate.candidate_id,
    file: candidate.file,

    mode: "TEST_MODE_NO_SIDE_EFFECTS",
    truth_warning: "NOT_TRUTH_SOURCE",
    completion_warning: "This packet does not write GitHub, mutate truth, or complete VERIFRAX.",

    dry_run: true,
    simulated: true,
    executed: false,
    stdout_only: true,

    writer_enabled: false,
    network_enabled: false,
    token_required: false,
    webhook_enabled: false,
    check_run_writer_enabled: false,
    pr_writer_enabled: false,
    issue_writer_enabled: false,
    package_publish_enabled: false,
    contents_write_enabled: false,
    main_write_enabled: false,
    allowed_to_mutate_truth: false,

    external_target: "NONE",
    payload
  });
}

export function compileTestModeWriterSimulation(operatorBundleReport, options = {}) {
  const generated_at = options.generated_at || operatorBundleReport.generated_at || "1970-01-01T00:00:00.000Z";
  const bundle = operatorBundleReport.bundle || operatorBundleReport;
  const cases = bundle.cases || [];

  const check_run_packets = cases.map((c) => noWriterEnvelope(
    "SIMULATED_CHECK_RUN_SUMMARY",
    c,
    {
      name: "admissorium/v0.2.0/report-only",
      conclusion: c.quarantine_required ? "neutral" : "success",
      title: c.quarantine_required ? "Quarantine required" : "Report-only admissible",
      summary: `candidate=${c.candidate_id} risk=${c.risk} verdict=${c.verdict_state}`
    },
    generated_at
  ));

  const issue_packets = cases
    .filter((c) => c.quarantine_required)
    .map((c) => noWriterEnvelope(
      "SIMULATED_PRIVATE_QUARANTINE_REVIEW_TICKET",
      c,
      {
        title: `[ADMISSORIUM quarantine] ${c.candidate_id}`,
        labels: ["admissorium", "private-review", "dry-run"],
        body: [
          `candidate_id=${c.candidate_id}`,
          `risk=${c.risk}`,
          `route=${c.quarantine_route}`,
          `quarantine_hash=${c.quarantine_hash}`,
          "No issue was created. This is a signed simulation packet."
        ].join("\n")
      },
      generated_at
    ));

  const pull_request_packets = cases.map((c) => noWriterEnvelope(
    "SIMULATED_DRY_RUN_REPAIR_PULL_REQUEST",
    c,
    {
      title: `[ADMISSORIUM dry-run repair] ${c.candidate_id}`,
      branch: `admissorium/dry-run/${c.candidate_id}`,
      body: [
        `candidate_id=${c.candidate_id}`,
        `repair_mode=${c.repair_mode}`,
        `repair_packet_hash=${c.repair_packet_hash}`,
        "No branch was pushed. No pull request was created. This is a signed simulation packet."
      ].join("\n")
    },
    generated_at
  ));

  const simulation = {
    simulation_type: "ADMISSORIUM_V020_TEST_MODE_WRITER_SIMULATION",
    schema_version: "1.0.0",
    generated_at,
    state: "ADMISSORIUM_V020_TEST_MODE_WRITER_SIMULATION_PASS",

    mode: "TEST_MODE_NO_SIDE_EFFECTS",
    truth_warning: "NOT_TRUTH_SOURCE",
    completion_warning: "This simulation does not make VERIFRAX_SYSTEM_COMPLETE true.",

    source_bundle_type: bundle.bundle_type,
    total_cases: cases.length,
    check_run_packet_count: check_run_packets.length,
    issue_packet_count: issue_packets.length,
    pull_request_packet_count: pull_request_packets.length,
    total_packets: check_run_packets.length + issue_packets.length + pull_request_packets.length,

    writer_enabled: false,
    network_enabled: false,
    token_required: false,
    webhook_enabled: false,
    check_run_writer_enabled: false,
    pr_writer_enabled: false,
    issue_writer_enabled: false,
    package_publish_enabled: false,
    contents_write_enabled: false,
    main_write_enabled: false,
    allowed_to_mutate_truth: false,

    packets: {
      check_run_packets,
      issue_packets,
      pull_request_packets
    }
  };

  return signObject(simulation, options.signing_seed);
}
