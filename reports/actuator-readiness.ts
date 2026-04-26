import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type ActuatorReadinessStatus = "PASS" | "FAIL";

export interface ActuatorReadinessRequirement {
  id: string;
  description: string;
  path: string;
  status: ActuatorReadinessStatus;
}

export interface ActuatorForbiddenMaterialization {
  id: string;
  description: string;
  pattern: string;
  paths: string[];
  status: ActuatorReadinessStatus;
}

export interface ActuatorReadinessArtifact {
  version: "0.3.0";
  ready: boolean;
  required_count: number;
  passed_count: number;
  failed_count: number;
  requirements: ActuatorReadinessRequirement[];
  forbidden_materialization: ActuatorForbiddenMaterialization[];
  boundary: {
    write_behavior: "NONE";
    server_binding: "NONE";
    execution: "PLAN_ONLY";
    token_exchange: "NOT_PERFORMED";
    truth_mutation: false;
    registry_mutation: false;
  };
}

export interface BuildActuatorReadinessInput {
  root: string;
}

export const REQUIRED_ACTUATOR_PIPELINE_FILES = [
  "app/check-run-plan.ts",
  "docs/check-run-plan.md",
  "tests/github-app/check-run-plan.test.ts",

  "app/check-run-writer-adapter.ts",
  "docs/check-run-writer-adapter.md",
  "tests/github-app/check-run-writer-adapter.test.ts",

  "app/quarantine-issue-plan.ts",
  "docs/quarantine-issue-plan.md",
  "tests/github-app/quarantine-issue-plan.test.ts",

  "app/quarantine-issue-writer-adapter.ts",
  "docs/quarantine-issue-writer-adapter.md",
  "tests/github-app/quarantine-issue-writer-adapter.test.ts",

  "app/projection-repair-pr-plan.ts",
  "docs/projection-repair-pr-plan.md",
  "tests/github-app/projection-repair-pr-plan.test.ts",

  "app/projection-repair-pr-writer-adapter.ts",
  "docs/projection-repair-pr-writer-adapter.md",
  "tests/github-app/projection-repair-pr-writer-adapter.test.ts",

  "app/actuator-dry-run-orchestrator.ts",
  "docs/actuator-dry-run-orchestrator.md",
  "tests/github-app/actuator-dry-run-orchestrator.test.ts",

  "app/installation-token-plan.ts",
  "docs/installation-token-plan.md",
  "tests/github-app/installation-token-plan.test.ts",

  "app/installation-token-exchange-adapter.ts",
  "docs/installation-token-exchange-adapter.md",
  "tests/github-app/installation-token-exchange-adapter.test.ts",

  "app/webhook-route-dispatcher.ts",
  "docs/webhook-route-dispatcher.md",
  "tests/github-app/webhook-route-dispatcher.test.ts",

  "app/webhook-request-handler.ts",
  "docs/webhook-request-handler.md",
  "tests/github-app/webhook-request-handler.test.ts",

  "app/actuator-request-pipeline-plan.ts",
  "docs/actuator-request-pipeline-plan.md",
  "tests/github-app/actuator-request-pipeline-plan.test.ts"
] as const;

const PLAN_ONLY_SCAN_FILES = [
  "app/actuator-dry-run-orchestrator.ts",
  "app/installation-token-plan.ts",
  "app/webhook-route-dispatcher.ts",
  "app/webhook-request-handler.ts",
  "app/actuator-request-pipeline-plan.ts"
] as const;

const FORBIDDEN_PATTERNS = [
  {
    id: "NO_SERVER_BINDING",
    description: "Plan-only actuator path must not bind an HTTP server or listener.",
    pattern: "\\b(createServer|listen|serve)\\s*\\("
  },
  {
    id: "NO_INSTALLATION_TOKEN_EXCHANGE",
    description: "Plan-only actuator path must not perform installation token exchange.",
    pattern: "createInstallationAccessToken|access_tokens|installationAccessToken|createAppAuth"
  },
  {
    id: "NO_TOKEN_PERSISTENCE",
    description: "Plan-only actuator path must not persist token material.",
    pattern: "writeFileSync|appendFileSync|createWriteStream"
  },
  {
    id: "NO_GITHUB_CLIENT_CONSTRUCTION",
    description: "Plan-only actuator path must not construct a GitHub API client.",
    pattern: "new\\s+Octokit|Octokit\\s*\\("
  },
  {
    id: "NO_REPOSITORY_WRITES",
    description: "Plan-only actuator path must not create check runs, issues, pull requests, branches, or repository contents.",
    pattern: "createCheckRun|createIssue|createPullRequest|createOrUpdateFileContents|git\\.createRef|repos\\.create"
  }
] as const;

function requirement(root: string, path: string): ActuatorReadinessRequirement {
  return {
    id: `REQUIRED:${path}`,
    description: `Required actuator boundary object exists: ${path}`,
    path,
    status: existsSync(join(root, path)) ? "PASS" : "FAIL"
  };
}

function scanForbidden(root: string, item: (typeof FORBIDDEN_PATTERNS)[number]): ActuatorForbiddenMaterialization {
  const regex = new RegExp(item.pattern, "i");
  const paths: string[] = [];

  for (const path of PLAN_ONLY_SCAN_FILES) {
    const fullPath = join(root, path);
    if (!existsSync(fullPath)) continue;

    const text = readFileSync(fullPath, "utf8");
    if (regex.test(text)) paths.push(path);
  }

  return {
    id: item.id,
    description: item.description,
    pattern: item.pattern,
    paths,
    status: paths.length === 0 ? "PASS" : "FAIL"
  };
}

export function buildActuatorReadiness(input: BuildActuatorReadinessInput): ActuatorReadinessArtifact {
  const requirements = REQUIRED_ACTUATOR_PIPELINE_FILES.map((path) => requirement(input.root, path));
  const forbidden = FORBIDDEN_PATTERNS.map((item) => scanForbidden(input.root, item));
  const failed_count =
    requirements.filter((item) => item.status === "FAIL").length +
    forbidden.filter((item) => item.status === "FAIL").length;

  return {
    version: "0.3.0",
    ready: failed_count === 0,
    required_count: requirements.length + forbidden.length,
    passed_count: requirements.filter((item) => item.status === "PASS").length + forbidden.filter((item) => item.status === "PASS").length,
    failed_count,
    requirements,
    forbidden_materialization: forbidden,
    boundary: {
      write_behavior: "NONE",
      server_binding: "NONE",
      execution: "PLAN_ONLY",
      token_exchange: "NOT_PERFORMED",
      truth_mutation: false,
      registry_mutation: false
    }
  };
}
