export type WebhookRouteDecision =
  | "ACKNOWLEDGE_ONLY"
  | "DISPATCH_PULL_REQUEST_PLAN"
  | "DISPATCH_PUSH_PLAN"
  | "DENY_EMERGENCY_STOP"
  | "DENY_MISSING_REPOSITORY"
  | "DENY_MISSING_HEAD_SHA"
  | "DENY_UNSUPPORTED_EVENT";

export type WebhookRouteTargetKind = "none" | "pull_request" | "push";

export interface WebhookRouteDispatcherInput {
  event: string;
  delivery: string;
  payload: unknown;
  env?: NodeJS.ProcessEnv;
}

export interface WebhookRoutePlan {
  decision: WebhookRouteDecision;
  event: string;
  delivery: string;
  repository: string | null;
  target_kind: WebhookRouteTargetKind;
  head_sha: string | null;
  ref: string | null;
  action: string | null;
  pull_request_number: number | null;
  write_behavior: "NONE";
  server_binding: "NONE";
  execution: "PLAN_ONLY";
  token_exchange: "NOT_PERFORMED";
  truth_mutation: false;
  registry_mutation: false;
  planned_steps: string[];
  reasons: string[];
}

function enabled(value: string | undefined): boolean {
  return value === "true" || value === "1" || value === "yes";
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function integer(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function repository(payload: unknown): string | null {
  if (!record(payload)) return null;
  if (!record(payload.repository)) return null;
  return text(payload.repository.full_name);
}

function action(payload: unknown): string | null {
  if (!record(payload)) return null;
  return text(payload.action);
}

function pullRequestNumber(payload: unknown): number | null {
  if (!record(payload)) return null;
  if (!record(payload.pull_request)) return null;
  return integer(payload.pull_request.number);
}

function pullRequestHeadSha(payload: unknown): string | null {
  if (!record(payload)) return null;
  if (!record(payload.pull_request)) return null;
  if (!record(payload.pull_request.head)) return null;
  return text(payload.pull_request.head.sha);
}

function pushHeadSha(payload: unknown): string | null {
  if (!record(payload)) return null;
  return text(payload.after);
}

function payloadRef(payload: unknown): string | null {
  if (!record(payload)) return null;
  return text(payload.ref);
}

function basePlan(input: WebhookRouteDispatcherInput, decision: WebhookRouteDecision): WebhookRoutePlan {
  return {
    decision,
    event: input.event,
    delivery: input.delivery,
    repository: repository(input.payload),
    target_kind: "none",
    head_sha: null,
    ref: null,
    action: action(input.payload),
    pull_request_number: pullRequestNumber(input.payload),
    write_behavior: "NONE",
    server_binding: "NONE",
    execution: "PLAN_ONLY",
    token_exchange: "NOT_PERFORMED",
    truth_mutation: false,
    registry_mutation: false,
    planned_steps: [],
    reasons: []
  };
}

export function dispatchWebhookRoute(input: WebhookRouteDispatcherInput): WebhookRoutePlan {
  const env = input.env ?? process.env;

  if (enabled(env.ADMISSORIUM_WEBHOOK_DISPATCH_DISABLED) || enabled(env.ADMISSORIUM_WRITE_DISABLED)) {
    const denied = basePlan(input, "DENY_EMERGENCY_STOP");
    denied.reasons.push("Emergency stop prevents webhook route dispatch.");
    return denied;
  }

  if (input.event === "ping") {
    const acknowledged = basePlan(input, "ACKNOWLEDGE_ONLY");
    acknowledged.reasons.push("GitHub ping event acknowledged without execution.");
    return acknowledged;
  }

  const repo = repository(input.payload);
  if (repo === null) {
    const denied = basePlan(input, "DENY_MISSING_REPOSITORY");
    denied.reasons.push("Webhook payload does not contain repository.full_name.");
    return denied;
  }

  if (input.event === "pull_request") {
    const sha = pullRequestHeadSha(input.payload);
    if (sha === null) {
      const denied = basePlan(input, "DENY_MISSING_HEAD_SHA");
      denied.repository = repo;
      denied.target_kind = "pull_request";
      denied.reasons.push("Pull request payload does not contain pull_request.head.sha.");
      return denied;
    }

    const routed = basePlan(input, "DISPATCH_PULL_REQUEST_PLAN");
    routed.repository = repo;
    routed.target_kind = "pull_request";
    routed.head_sha = sha;
    routed.planned_steps = [
      "parse verified webhook envelope",
      "build admissibility audit plan",
      "build dry-run check-run plan",
      "build projection-repair or quarantine plans only if report class requires them",
      "return plans without server binding or repository writes"
    ];
    routed.reasons.push("Pull request event is routable to an admissibility execution plan.");
    return routed;
  }

  if (input.event === "push") {
    const sha = pushHeadSha(input.payload);
    if (sha === null) {
      const denied = basePlan(input, "DENY_MISSING_HEAD_SHA");
      denied.repository = repo;
      denied.target_kind = "push";
      denied.ref = payloadRef(input.payload);
      denied.reasons.push("Push payload does not contain after commit sha.");
      return denied;
    }

    const routed = basePlan(input, "DISPATCH_PUSH_PLAN");
    routed.repository = repo;
    routed.target_kind = "push";
    routed.head_sha = sha;
    routed.ref = payloadRef(input.payload);
    routed.planned_steps = [
      "parse verified webhook envelope",
      "build admissibility audit plan for pushed ref",
      "build dry-run check-run plan",
      "return plans without server binding or repository writes"
    ];
    routed.reasons.push("Push event is routable to an admissibility execution plan.");
    return routed;
  }

  const denied = basePlan(input, "DENY_UNSUPPORTED_EVENT");
  denied.repository = repo;
  denied.reasons.push(`Unsupported webhook event: ${input.event}`);
  return denied;
}
