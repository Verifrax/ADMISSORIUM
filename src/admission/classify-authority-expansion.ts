export function classifyAuthorityExpansion(actions: string[]) {
  const forbidden = actions.filter((a) =>
    [
      "issue_authority",
      "accept_state",
      "define_law",
      "write_main",
      "publish_package",
      "assign_recourse",
      "recognize_terminal_truth"
    ].includes(a)
  );
  return {
    authority_expansion_detected: forbidden.length > 0,
    forbidden,
    decision: forbidden.length ? "BLOCKED_AUTHORITY_EXPANSION" : "ADMISSIBLE"
  };
}
