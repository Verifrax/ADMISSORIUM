import { evaluateProtectedTruthPaths } from "../policy/evaluate-protected-truth-paths.js";

export function refuseTruthPathRepair(paths: string[]) {
  const evaluation = evaluateProtectedTruthPaths(paths);
  return {
    repair_allowed: !evaluation.protected_path_touched,
    decision: evaluation.protected_path_touched ? "BLOCKED_PROTECTED_TRUTH_PATH" : "PROJECTION_REPAIR_DRY_RUN_ONLY",
    ...evaluation
  };
}
