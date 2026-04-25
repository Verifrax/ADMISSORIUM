import type { CheckRunPlan } from "./check-run-plan.js";

export type CheckRunWriterAdapterVerdict =
  | "SKIPPED_DRY_RUN"
  | "SKIPPED_WRITE_DISABLED"
  | "SKIPPED_PERMISSION_DENIED"
  | "WRITTEN_CHECK_RUN";

export interface GitHubCheckRunCreateInput {
  owner: string;
  repo: string;
  name: string;
  head_sha: string;
  status: "completed";
  conclusion: "success" | "failure" | "neutral";
  output: {
    title: string;
    summary: string;
    text: string;
  };
  details_url?: string;
}

export interface GitHubCheckRunCreateResult {
  id: number;
  html_url?: string;
}

export interface GitHubCheckRunClient {
  createCheckRun(input: GitHubCheckRunCreateInput): Promise<GitHubCheckRunCreateResult>;
}

export interface GuardedCheckRunWriterInput {
  plan: CheckRunPlan;
  client: GitHubCheckRunClient;
  executeWrite: boolean;
  env?: NodeJS.ProcessEnv;
}

export interface GuardedCheckRunWriterResult {
  verdict: CheckRunWriterAdapterVerdict;
  write_attempted: boolean;
  write_performed: boolean;
  reason: string;
  request?: GitHubCheckRunCreateInput;
  result?: GitHubCheckRunCreateResult;
}

function splitRepository(fullName: string): { owner: string; repo: string } {
  const parts = fullName.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Invalid repository full name: ${fullName}`);
  }
  return { owner: parts[0], repo: parts[1] };
}

function buildRequest(plan: CheckRunPlan): GitHubCheckRunCreateInput {
  const { owner, repo } = splitRepository(plan.repository);
  const request: GitHubCheckRunCreateInput = {
    owner,
    repo,
    name: plan.name,
    head_sha: plan.head_sha,
    status: plan.status,
    conclusion: plan.conclusion,
    output: {
      title: plan.title,
      summary: plan.summary,
      text: plan.text
    }
  };

  if (plan.details_url) {
    return { ...request, details_url: plan.details_url };
  }

  return request;
}

function writeDisabled(env: NodeJS.ProcessEnv | undefined): boolean {
  return env?.ADMISSORIUM_WRITE_DISABLED === "true";
}

export async function writeGitHubCheckRunGuarded(
  input: GuardedCheckRunWriterInput
): Promise<GuardedCheckRunWriterResult> {
  const request = buildRequest(input.plan);

  if (!input.executeWrite || input.plan.dry_run) {
    return {
      verdict: "SKIPPED_DRY_RUN",
      write_attempted: false,
      write_performed: false,
      reason: "Check-run writer adapter remained in dry-run mode.",
      request
    };
  }

  if (writeDisabled(input.env)) {
    return {
      verdict: "SKIPPED_WRITE_DISABLED",
      write_attempted: false,
      write_performed: false,
      reason: "ADMISSORIUM_WRITE_DISABLED=true blocks check-run write.",
      request
    };
  }

  if (input.plan.permission_decision.decision !== "ALLOW") {
    return {
      verdict: "SKIPPED_PERMISSION_DENIED",
      write_attempted: false,
      write_performed: false,
      reason: `Permission policy blocked check-run write: ${input.plan.permission_decision.decision}`,
      request
    };
  }

  const result = await input.client.createCheckRun(request);

  return {
    verdict: "WRITTEN_CHECK_RUN",
    write_attempted: true,
    write_performed: true,
    reason: "GitHub check-run write completed through guarded adapter.",
    request,
    result
  };
}
