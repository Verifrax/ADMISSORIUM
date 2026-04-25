import { buildCheckRunPlan, type CheckRunPlan } from "./check-run-plan.js";
import { buildProjectionRepairPrPlan, type ProjectionRepairPrPlan } from "./projection-repair-pr-plan.js";
import { buildQuarantineIssuePlan, type QuarantineIssuePlan } from "./quarantine-issue-plan.js";
import type { AdmissibilityReport } from "../src/types.js";

export interface ActuatorDryRunOrchestrationInput {
  report: AdmissibilityReport;
  repositoryFullName: string;
  headSha: string;
  env?: NodeJS.ProcessEnv;
}

export interface ActuatorDryRunOrchestration {
  dry_run: true;
  write_behavior: "NONE";
  repository: string;
  head_sha: string;
  run_id: string;
  admissibility_verdict: string;
  check_run_plan: CheckRunPlan;
  projection_repair_pr_plan: ProjectionRepairPrPlan;
  quarantine_issue_plan: QuarantineIssuePlan;
  summary: {
    check_run_conclusion: string;
    projection_repair_required: boolean;
    projection_repair_change_count: number;
    projection_repair_blocked_count: number;
    quarantine_issue_required: boolean;
    quarantine_finding_count: number;
    write_disabled: boolean;
  };
}

function writeDisabled(env: NodeJS.ProcessEnv | undefined): boolean {
  return env?.ADMISSORIUM_WRITE_DISABLED === "true";
}

export function orchestrateActuatorDryRun(
  input: ActuatorDryRunOrchestrationInput
): ActuatorDryRunOrchestration {
  const checkRunPlan = buildCheckRunPlan({
    report: input.report,
    repositoryFullName: input.repositoryFullName,
    headSha: input.headSha,
    ...(input.env === undefined ? {} : { env: input.env })
  });

  const projectionRepairPrPlan = buildProjectionRepairPrPlan({
    report: input.report,
    repositoryFullName: input.repositoryFullName
  });

  const quarantineIssuePlan = buildQuarantineIssuePlan({
    report: input.report,
    repositoryFullName: input.repositoryFullName
  });

  return {
    dry_run: true,
    write_behavior: "NONE",
    repository: input.repositoryFullName,
    head_sha: input.headSha,
    run_id: input.report.run_id,
    admissibility_verdict: input.report.verdict,
    check_run_plan: checkRunPlan,
    projection_repair_pr_plan: projectionRepairPrPlan,
    quarantine_issue_plan: quarantineIssuePlan,
    summary: {
      check_run_conclusion: checkRunPlan.conclusion,
      projection_repair_required: projectionRepairPrPlan.required,
      projection_repair_change_count: projectionRepairPrPlan.change_count,
      projection_repair_blocked_count: projectionRepairPrPlan.blocked_count,
      quarantine_issue_required: quarantineIssuePlan.required,
      quarantine_finding_count: quarantineIssuePlan.finding_count,
      write_disabled: writeDisabled(input.env)
    }
  };
}
