import { evaluateProtectedTruthPaths } from "../policy/evaluate-protected-truth-paths.js";

export function assertProjectionOnly(paths: string[]) {
  const protectedEvaluation = evaluateProtectedTruthPaths(paths);
  return {
    projection_only_assertion: !protectedEvaluation.protected_path_touched,
    ...protectedEvaluation
  };
}
