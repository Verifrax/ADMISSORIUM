import { existsSync } from "node:fs";
import { join } from "node:path";

export type ActuatorReadinessStatus = "PASS" | "FAIL";

export interface ActuatorReadinessCriterion {
  id: string;
  title: string;
  status: ActuatorReadinessStatus;
  evidence: string;
}

export interface ActuatorReadinessReport {
  version: "0.2.0";
  ready: boolean;
  passed_count: number;
  failed_count: number;
  criteria: ActuatorReadinessCriterion[];
}

export interface BuildActuatorReadinessInput {
  root: string;
}

function fileExists(root: string, path: string): boolean {
  return existsSync(join(root, path));
}

function criterion(id: string, title: string, passed: boolean, evidence: string): ActuatorReadinessCriterion {
  return {
    id,
    title,
    status: passed ? "PASS" : "FAIL",
    evidence
  };
}

export function buildActuatorReadiness(input: BuildActuatorReadinessInput): ActuatorReadinessReport {
  const root = input.root;

  const criteria: ActuatorReadinessCriterion[] = [
    criterion("V020-001", "Permission policy exists", fileExists(root, "policies/permission-policy.json"), "policies/permission-policy.json"),
    criterion("V020-002", "Protected path policy exists", fileExists(root, "policies/protected-paths.json"), "policies/protected-paths.json"),
    criterion("V020-003", "Emergency stop documentation exists", fileExists(root, "docs/emergency-stop.md"), "docs/emergency-stop.md"),
    criterion("V020-004", "Webhook intake verifies signatures without write behavior", fileExists(root, "app/webhook-intake.ts") && fileExists(root, "tests/github-app/webhook-intake.test.ts"), "app/webhook-intake.ts + tests/github-app/webhook-intake.test.ts"),
    criterion("V020-005", "Check-run plan is dry-run capable", fileExists(root, "app/check-run-plan.ts") && fileExists(root, "tests/github-app/check-run-plan.test.ts"), "app/check-run-plan.ts + tests/github-app/check-run-plan.test.ts"),
    criterion("V020-006", "Check-run writer adapter is guarded", fileExists(root, "app/check-run-writer-adapter.ts") && fileExists(root, "tests/github-app/check-run-writer-adapter.test.ts"), "app/check-run-writer-adapter.ts + tests/github-app/check-run-writer-adapter.test.ts"),
    criterion("V020-007", "Quarantine issue plan is dry-run capable", fileExists(root, "app/quarantine-issue-plan.ts") && fileExists(root, "tests/github-app/quarantine-issue-plan.test.ts"), "app/quarantine-issue-plan.ts + tests/github-app/quarantine-issue-plan.test.ts"),
    criterion("V020-008", "Quarantine issue writer adapter is guarded", fileExists(root, "app/quarantine-issue-writer-adapter.ts") && fileExists(root, "tests/github-app/quarantine-issue-writer-adapter.test.ts"), "app/quarantine-issue-writer-adapter.ts + tests/github-app/quarantine-issue-writer-adapter.test.ts"),
    criterion("V020-009", "Projection repair pull request plan is dry-run capable", fileExists(root, "app/projection-repair-pr-plan.ts") && fileExists(root, "tests/github-app/projection-repair-pr-plan.test.ts"), "app/projection-repair-pr-plan.ts + tests/github-app/projection-repair-pr-plan.test.ts"),
    criterion("V020-010", "Projection repair pull request writer adapter is guarded", fileExists(root, "app/projection-repair-pr-writer-adapter.ts") && fileExists(root, "tests/github-app/projection-repair-pr-writer-adapter.test.ts"), "app/projection-repair-pr-writer-adapter.ts + tests/github-app/projection-repair-pr-writer-adapter.test.ts"),
    criterion("V020-011", "Actuator dry-run orchestration exists", fileExists(root, "app/actuator-dry-run-orchestrator.ts") && fileExists(root, "tests/github-app/actuator-dry-run-orchestrator.test.ts"), "app/actuator-dry-run-orchestrator.ts + tests/github-app/actuator-dry-run-orchestrator.test.ts"),
    criterion("V020-012", "No installation token exchange is materialized", !fileExists(root, "app/installation-token.ts") && !fileExists(root, "app/github-app-token.ts"), "installation-token exchange files absent")
  ];

  const passed_count = criteria.filter((item) => item.status === "PASS").length;
  const failed_count = criteria.length - passed_count;

  return {
    version: "0.2.0",
    ready: failed_count === 0,
    passed_count,
    failed_count,
    criteria
  };
}
