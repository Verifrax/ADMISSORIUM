export function assertNoDeletion(action: string) {
  return {
    deletion_allowed: false,
    action_allowed: action !== "delete",
    decision: action === "delete" ? "QUARANTINE_REQUIRED" : "ADMISSIBLE_WITH_WARNINGS"
  };
}
