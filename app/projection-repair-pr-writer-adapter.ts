import type { ProjectionRepairPrPlan } from "./projection-repair-pr-plan.js";

export type ProjectionRepairPrWriterAdapterVerdict =
  | "SKIPPED_DRY_RUN"
  | "SKIPPED_WRITE_DISABLED"
  | "SKIPPED_NOT_REQUIRED"
  | "WRITTEN_PULL_REQUEST";

export interface GitHubPullRequestCreateInput {
  owner: string;
  repo: string;
  base: string;
  head: string;
  title: string;
  body: string;
  labels: string[];
}

export interface GitHubPullRequestCreateResult {
  number: number;
  html_url?: string;
}

export interface GitHubPullRequestClient {
  createPullRequest(input: GitHubPullRequestCreateInput): Promise<GitHubPullRequestCreateResult>;
}

export type ExecutableProjectionRepairPrPlan = Omit<ProjectionRepairPrPlan, "dry_run"> & {
  dry_run: boolean;
};

export interface GuardedProjectionRepairPrWriterInput {
  plan: ExecutableProjectionRepairPrPlan;
  client: GitHubPullRequestClient;
  executeWrite: boolean;
  env?: NodeJS.ProcessEnv;
}

export interface GuardedProjectionRepairPrWriterResult {
  verdict: ProjectionRepairPrWriterAdapterVerdict;
  write_attempted: boolean;
  write_performed: boolean;
  reason: string;
  request: GitHubPullRequestCreateInput;
  result?: GitHubPullRequestCreateResult;
}

function splitRepository(fullName: string): { owner: string; repo: string } {
  const parts = fullName.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Invalid repository full name: ${fullName}`);
  }
  return { owner: parts[0], repo: parts[1] };
}

function buildRequest(plan: ExecutableProjectionRepairPrPlan): GitHubPullRequestCreateInput {
  const { owner, repo } = splitRepository(plan.repository);

  return {
    owner,
    repo,
    base: plan.base_branch,
    head: plan.head_branch,
    title: plan.title,
    body: plan.body,
    labels: plan.labels
  };
}

function writeDisabled(env: NodeJS.ProcessEnv | undefined): boolean {
  return env?.ADMISSORIUM_WRITE_DISABLED === "true";
}

export async function writeProjectionRepairPrGuarded(
  input: GuardedProjectionRepairPrWriterInput
): Promise<GuardedProjectionRepairPrWriterResult> {
  const request = buildRequest(input.plan);

  if (!input.executeWrite || input.plan.dry_run) {
    return {
      verdict: "SKIPPED_DRY_RUN",
      write_attempted: false,
      write_performed: false,
      reason: "Projection repair pull request writer adapter remained in dry-run mode.",
      request
    };
  }

  if (writeDisabled(input.env)) {
    return {
      verdict: "SKIPPED_WRITE_DISABLED",
      write_attempted: false,
      write_performed: false,
      reason: "ADMISSORIUM_WRITE_DISABLED=true blocks projection repair pull request write.",
      request
    };
  }

  if (!input.plan.required) {
    return {
      verdict: "SKIPPED_NOT_REQUIRED",
      write_attempted: false,
      write_performed: false,
      reason: "Projection repair pull request plan does not require a pull request.",
      request
    };
  }

  const result = await input.client.createPullRequest(request);

  return {
    verdict: "WRITTEN_PULL_REQUEST",
    write_attempted: true,
    write_performed: true,
    reason: "GitHub projection repair pull request write completed through guarded adapter.",
    request,
    result
  };
}
