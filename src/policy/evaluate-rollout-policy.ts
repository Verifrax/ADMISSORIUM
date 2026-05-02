import { loadPolicy } from "./load-policy.js";

export function evaluateRolloutPolicy(stage: string) {
  const policy = loadPolicy<{ stages: string[] }>("rollout-policy.json");
  return {
    rollout_stage: stage,
    rollout_stage_known: policy.stages.includes(stage),
    rollout_stage_allowed: policy.stages.includes(stage)
  };
}
