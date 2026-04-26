import { createHmac, timingSafeEqual } from "node:crypto";
import { dispatchWebhookRoute, type WebhookRoutePlan } from "./webhook-route-dispatcher.js";

export type WebhookRequestHandlerDecision =
  | "ROUTED"
  | "DENIED_INTAKE"
  | "DENIED_ROUTE";

export interface WebhookRequestHandlerInput {
  headers: Record<string, string | string[] | undefined>;
  body: string;
  secret: string;
  env?: NodeJS.ProcessEnv;
}

export interface WebhookRequestEnvelope {
  event: string;
  delivery: string;
  payload: unknown;
}

export interface WebhookRequestHandlerResult {
  decision: WebhookRequestHandlerDecision;
  accepted: boolean;
  status_code: 202 | 400 | 401 | 403 | 422;
  envelope: WebhookRequestEnvelope | null;
  route_plan: WebhookRoutePlan | null;
  write_behavior: "NONE";
  server_binding: "NONE";
  execution: "PLAN_ONLY";
  token_exchange: "NOT_PERFORMED";
  truth_mutation: false;
  registry_mutation: false;
  reasons: string[];
}

function header(headers: WebhookRequestHandlerInput["headers"], name: string): string | null {
  const wanted = name.toLowerCase();

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== wanted) continue;
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  }

  return null;
}

function baseResult(
  decision: WebhookRequestHandlerDecision,
  accepted: boolean,
  status_code: WebhookRequestHandlerResult["status_code"],
  envelope: WebhookRequestEnvelope | null,
  route_plan: WebhookRoutePlan | null,
  reasons: string[]
): WebhookRequestHandlerResult {
  return {
    decision,
    accepted,
    status_code,
    envelope,
    route_plan,
    write_behavior: "NONE",
    server_binding: "NONE",
    execution: "PLAN_ONLY",
    token_exchange: "NOT_PERFORMED",
    truth_mutation: false,
    registry_mutation: false,
    reasons
  };
}

function expectedSignature(secret: string, body: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

function validSignature(secret: string, body: string, observed: string | null): boolean {
  if (observed === null) return false;
  if (!observed.startsWith("sha256=")) return false;

  const expected = expectedSignature(secret, body);
  const observedBuffer = Buffer.from(observed, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (observedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(observedBuffer, expectedBuffer);
}

function routeStatus(decision: WebhookRoutePlan["decision"]): 202 | 403 | 422 {
  if (decision === "DENY_EMERGENCY_STOP") return 403;
  if (decision.startsWith("DENY_")) return 422;
  return 202;
}

export function handleWebhookRequest(input: WebhookRequestHandlerInput): WebhookRequestHandlerResult {
  const event = header(input.headers, "x-github-event");
  const delivery = header(input.headers, "x-github-delivery");
  const signature = header(input.headers, "x-hub-signature-256");

  if (event === null || delivery === null) {
    return baseResult("DENIED_INTAKE", false, 400, null, null, ["Missing required GitHub webhook headers."]);
  }

  if (!validSignature(input.secret, input.body, signature)) {
    return baseResult("DENIED_INTAKE", false, 401, null, null, ["Webhook signature verification failed."]);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(input.body) as unknown;
  } catch {
    return baseResult("DENIED_INTAKE", false, 400, null, null, ["Webhook payload is not valid JSON."]);
  }

  const envelope: WebhookRequestEnvelope = {
    event,
    delivery,
    payload
  };

  const routeInput =
    input.env === undefined
      ? { event: envelope.event, delivery: envelope.delivery, payload: envelope.payload }
      : { event: envelope.event, delivery: envelope.delivery, payload: envelope.payload, env: input.env };

  const routePlan = dispatchWebhookRoute(routeInput);
  const denied = routePlan.decision.startsWith("DENY_");

  return baseResult(
    denied ? "DENIED_ROUTE" : "ROUTED",
    !denied,
    routeStatus(routePlan.decision),
    envelope,
    routePlan,
    routePlan.reasons
  );
}
