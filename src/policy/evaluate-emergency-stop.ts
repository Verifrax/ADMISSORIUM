import { loadPolicy } from "./load-policy.js";

export type EmergencyStopEvaluation = {
  active: boolean;
  environment_switch: string;
  side_effects_allowed: boolean;
};

export function evaluateEmergencyStop(env = process.env): EmergencyStopEvaluation {
  const policy = loadPolicy<{ environment_switch: string }>("emergency-stop.json");
  const active = env[policy.environment_switch] === "true";
  return {
    active,
    environment_switch: policy.environment_switch,
    side_effects_allowed: !active
  };
}
