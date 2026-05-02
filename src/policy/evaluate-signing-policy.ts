import { loadPolicy } from "./load-policy.js";

export function evaluateSigningPolicy() {
  const policy = loadPolicy<Record<string, unknown>>("signing-policy.json");
  return {
    signing_policy_readable: true,
    algorithm: policy.algorithm,
    unsigned_verdict_decision: policy.unsigned_verdict_decision
  };
}
