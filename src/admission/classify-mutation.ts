import { evaluateProtectedTruthPaths } from "../policy/evaluate-protected-truth-paths.js";

export function classifyMutation(paths: string[]) {
  const protectedEvaluation = evaluateProtectedTruthPaths(paths);
  if (protectedEvaluation.protected_path_touched) {
    return {
      mutation_class: "PROTECTED_TRUTH_PATH_MUTATION",
      decision: "BLOCKED_PROTECTED_TRUTH_PATH",
      ...protectedEvaluation
    };
  }
  return {
    mutation_class: "PROJECTION_OR_IMPLEMENTATION_MUTATION",
    decision: "PROJECTION_REPAIR_DRY_RUN_ONLY",
    ...protectedEvaluation
  };
}
