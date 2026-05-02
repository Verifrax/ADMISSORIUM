export function compareAcceptedVsCandidate(accepted: unknown, candidate: unknown) {
  const acceptedJson = JSON.stringify(accepted);
  const candidateJson = JSON.stringify(candidate);
  return {
    accepted_equals_candidate: acceptedJson === candidateJson,
    current_truth_split_detected: false
  };
}
