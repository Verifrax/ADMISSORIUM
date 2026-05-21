function globToRegExp(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "§DOUBLESTAR§")
    .replace(/\*/g, "[^/]*")
    .replace(/§DOUBLESTAR§/g, ".*");
  return new RegExp(`^${escaped}$`);
}

export function evaluateProtectedTruthPaths({ changedPaths, policy }) {
  const protectedPatterns = policy.protected_paths || [];
  const matched = [];

  for (const path of changedPaths) {
    for (const pattern of protectedPatterns) {
      if (globToRegExp(pattern).test(path)) {
        matched.push({ path, pattern });
      }
    }
  }

  if (matched.length === 0) {
    return {
      verdict: "PROTECTED_TRUTH_FIREWALL_PASS",
      protected_truth_touched: false,
      automatic_projection_repair_allowed: true,
      direct_write_allowed: false,
      matched
    };
  }

  return {
    verdict: "BLOCKED_PROTECTED_TRUTH_PATH",
    protected_truth_touched: true,
    automatic_projection_repair_allowed: false,
    direct_write_allowed: false,
    required_decision: policy.if_touched.required_decision,
    matched
  };
}
