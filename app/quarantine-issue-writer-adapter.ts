import type { QuarantineIssuePlan } from "./quarantine-issue-plan.js";

export type QuarantineIssueWriterAdapterVerdict =
  | "SKIPPED_DRY_RUN"
  | "SKIPPED_WRITE_DISABLED"
  | "SKIPPED_NOT_REQUIRED"
  | "WRITTEN_ISSUE";

export interface GitHubIssueCreateInput {
  owner: string;
  repo: string;
  title: string;
  body: string;
  labels: string[];
}

export interface GitHubIssueCreateResult {
  number: number;
  html_url?: string;
}

export interface GitHubIssueClient {
  createIssue(input: GitHubIssueCreateInput): Promise<GitHubIssueCreateResult>;
}

export type ExecutableQuarantineIssuePlan = Omit<QuarantineIssuePlan, "dry_run"> & {
  dry_run: boolean;
};

export interface GuardedQuarantineIssueWriterInput {
  plan: ExecutableQuarantineIssuePlan;
  client: GitHubIssueClient;
  executeWrite: boolean;
  env?: NodeJS.ProcessEnv;
}

export interface GuardedQuarantineIssueWriterResult {
  verdict: QuarantineIssueWriterAdapterVerdict;
  write_attempted: boolean;
  write_performed: boolean;
  reason: string;
  request: GitHubIssueCreateInput;
  result?: GitHubIssueCreateResult;
}

function splitRepository(fullName: string): { owner: string; repo: string } {
  const parts = fullName.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Invalid repository full name: ${fullName}`);
  }
  return { owner: parts[0], repo: parts[1] };
}

function buildRequest(plan: ExecutableQuarantineIssuePlan): GitHubIssueCreateInput {
  const { owner, repo } = splitRepository(plan.repository);

  return {
    owner,
    repo,
    title: plan.title,
    body: plan.body,
    labels: plan.labels
  };
}

function writeDisabled(env: NodeJS.ProcessEnv | undefined): boolean {
  return env?.ADMISSORIUM_WRITE_DISABLED === "true";
}

export async function writeQuarantineIssueGuarded(
  input: GuardedQuarantineIssueWriterInput
): Promise<GuardedQuarantineIssueWriterResult> {
  const request = buildRequest(input.plan);

  if (!input.executeWrite || input.plan.dry_run) {
    return {
      verdict: "SKIPPED_DRY_RUN",
      write_attempted: false,
      write_performed: false,
      reason: "Quarantine issue writer adapter remained in dry-run mode.",
      request
    };
  }

  if (writeDisabled(input.env)) {
    return {
      verdict: "SKIPPED_WRITE_DISABLED",
      write_attempted: false,
      write_performed: false,
      reason: "ADMISSORIUM_WRITE_DISABLED=true blocks quarantine issue write.",
      request
    };
  }

  if (!input.plan.required) {
    return {
      verdict: "SKIPPED_NOT_REQUIRED",
      write_attempted: false,
      write_performed: false,
      reason: "Quarantine issue plan does not require an issue.",
      request
    };
  }

  const result = await input.client.createIssue(request);

  return {
    verdict: "WRITTEN_ISSUE",
    write_attempted: true,
    write_performed: true,
    reason: "GitHub quarantine issue write completed through guarded adapter.",
    request,
    result
  };
}
