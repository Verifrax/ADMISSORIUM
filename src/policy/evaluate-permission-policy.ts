import { loadPolicy } from "./load-policy.js";

export function evaluatePermissionPolicy() {
  const policy = loadPolicy<Record<string, unknown>>("permission-policy.json");
  return {
    policy_type: policy.policy_type,
    permission_policy_readable: true,
    forbidden_actions_enforced: Array.isArray(policy.forbidden_actions)
  };
}
