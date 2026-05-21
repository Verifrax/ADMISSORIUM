export function evaluateGitHubAppPermissions({ requested, policy }) {
  const forbidden = [];
  const allowed = policy.allowed || {};

  for (const [name, level] of Object.entries(requested || {})) {
    if ((policy.forbidden || []).includes(name)) {
      forbidden.push({ name, level, reason: "explicitly_forbidden" });
      continue;
    }

    if (!Object.prototype.hasOwnProperty.call(allowed, name)) {
      forbidden.push({ name, level, reason: "not_allowlisted" });
      continue;
    }

    const allowedLevel = allowed[name];
    if (allowedLevel === "read" && level !== "read") {
      forbidden.push({ name, level, reason: "write_requested_where_only_read_allowed" });
    }
  }

  return {
    verdict: forbidden.length ? "BLOCKED_PERMISSION_EXPANSION" : "PERMISSION_POLICY_PASS",
    forbidden
  };
}
