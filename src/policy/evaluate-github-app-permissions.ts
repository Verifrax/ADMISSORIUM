import { loadPolicy } from "./load-policy.js";

export function evaluateGithubAppPermissions(granted: Record<string, string> = {}) {
  const policy = loadPolicy<{ forbidden_permissions: Record<string, string> }>("github-app-permission-policy.json");
  const overgrants = Object.entries(policy.forbidden_permissions)
    .filter(([permission, level]) => granted[permission] === level)
    .map(([permission, level]) => `${permission}:${level}`);
  return {
    permission_minimized: overgrants.length === 0,
    overgrants
  };
}
