export function classifyRoleCollapse(statement: string) {
  const s = statement.toLowerCase();
  const collapsed =
    s.includes("verification is recognition") ||
    s.includes("recognition is recourse") ||
    s.includes("authority is execution") ||
    s.includes("law is state");
  return {
    role_collapse_detected: collapsed,
    decision: collapsed ? "BLOCKED_ROLE_COLLAPSE" : "ADMISSIBLE"
  };
}
