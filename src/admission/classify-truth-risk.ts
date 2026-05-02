export function classifyTruthRisk(text: string) {
  const lower = text.toLowerCase();
  const risks = [
    lower.includes("admissorium decides truth") && "ADMISSORIUM_SOVEREIGN_ROLE_CLAIM",
    lower.includes("finished sovereign external reality") && "MACHINE_DEFERENCE_OVERCLAIM",
    lower.includes("recognition = recourse") && "RECOGNITION_RECOURSE_COLLAPSE"
  ].filter(Boolean);
  return {
    risk_count: risks.length,
    risks,
    decision: risks.length ? "BLOCKED_INADMISSIBLE" : "ADMISSIBLE"
  };
}
