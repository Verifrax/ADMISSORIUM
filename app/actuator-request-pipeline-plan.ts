import { handleWebhookRequest, type WebhookRequestHandlerInput, type WebhookRequestHandlerResult } from "./webhook-request-handler.js";
import { buildInstallationTokenPlan, type InstallationTokenPlan } from "./installation-token-plan.js";
import { orchestrateActuatorDryRun, type ActuatorDryRunOrchestration } from "./actuator-dry-run-orchestrator.js";
import type { AdmissibilityReport } from "../src/types.js";

export type ActuatorRequestPipelineDecision =
  | "PIPELINE_PLANNED"
  | "PIPELINE_DENIED";

export interface ActuatorRequestPipelineInput {
  request: WebhookRequestHandlerInput;
  report: AdmissibilityReport;
  repositoryFullName?: string;
  appIdRef?: string;
  installationIdRef?: string;
  privateKeyRef?: string;
  env?: NodeJS.ProcessEnv;
}

export interface ActuatorRequestPipelinePlan {
  decision: ActuatorRequestPipelineDecision;
  accepted: boolean;
  repository: string | null;
  head_sha: string | null;
  webhook: WebhookRequestHandlerResult;
  installation_token_plan: InstallationTokenPlan | null;
  actuator_orchestration: ActuatorDryRunOrchestration | null;
  write_behavior: "NONE";
  server_binding: "NONE";
  execution: "PLAN_ONLY";
  token_exchange: "NOT_PERFORMED";
  truth_mutation: false;
  registry_mutation: false;
  reasons: string[];
}

function resolvedRepository(input: ActuatorRequestPipelineInput, webhook: WebhookRequestHandlerResult): string | null {
  return input.repositoryFullName ?? webhook.route_plan?.repository ?? null;
}

function envOf(input: ActuatorRequestPipelineInput): NodeJS.ProcessEnv | undefined {
  return input.env ?? input.request.env;
}

function denied(webhook: WebhookRequestHandlerResult): ActuatorRequestPipelinePlan {
  return {
    decision: "PIPELINE_DENIED",
    accepted: false,
    repository: webhook.route_plan?.repository ?? null,
    head_sha: webhook.route_plan?.head_sha ?? null,
    webhook,
    installation_token_plan: null,
    actuator_orchestration: null,
    write_behavior: "NONE",
    server_binding: "NONE",
    execution: "PLAN_ONLY",
    token_exchange: "NOT_PERFORMED",
    truth_mutation: false,
    registry_mutation: false,
    reasons: webhook.reasons.length > 0 ? webhook.reasons : ["Webhook request did not produce a routable plan."]
  };
}

export function buildActuatorRequestPipelinePlan(input: ActuatorRequestPipelineInput): ActuatorRequestPipelinePlan {
  const webhook = handleWebhookRequest(input.request);

  if (!webhook.accepted || webhook.route_plan === null) {
    return denied(webhook);
  }

  const repository = resolvedRepository(input, webhook);
  if (repository === null) {
    return denied(webhook);
  }

  const env = envOf(input);
  const appIdRef = input.appIdRef ?? "env:ADMISSORIUM_GITHUB_APP_ID";
  const installationIdRef = input.installationIdRef ?? "env:ADMISSORIUM_GITHUB_INSTALLATION_ID";
  const privateKeyRef = input.privateKeyRef ?? "env:ADMISSORIUM_GITHUB_PRIVATE_KEY_REF";
  const headSha = webhook.route_plan.head_sha ?? "0000000000000000000000000000000000000000";

  const installationTokenPlan =
    env === undefined
      ? buildInstallationTokenPlan({
          repositoryFullName: repository,
          mode: "dry-run",
          appId: appIdRef,
          installationId: installationIdRef,
          privateKeyRef
        })
      : buildInstallationTokenPlan({
          repositoryFullName: repository,
          mode: "dry-run",
          appId: appIdRef,
          installationId: installationIdRef,
          privateKeyRef,
          env
        });

  const actuatorOrchestration =
    env === undefined
      ? orchestrateActuatorDryRun({
          report: input.report,
          repositoryFullName: repository,
          headSha
        })
      : orchestrateActuatorDryRun({
          report: input.report,
          repositoryFullName: repository,
          headSha,
          env
        });

  return {
    decision: "PIPELINE_PLANNED",
    accepted: true,
    repository,
    head_sha: webhook.route_plan.head_sha,
    webhook,
    installation_token_plan: installationTokenPlan,
    actuator_orchestration: actuatorOrchestration,
    write_behavior: "NONE",
    server_binding: "NONE",
    execution: "PLAN_ONLY",
    token_exchange: "NOT_PERFORMED",
    truth_mutation: false,
    registry_mutation: false,
    reasons: [
      "Webhook request produced a route plan.",
      "Installation token request is represented as a non-executing plan.",
      "Actuator orchestration is dry-run only."
    ]
  };
}
