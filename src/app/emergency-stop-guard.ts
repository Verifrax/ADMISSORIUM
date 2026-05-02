import { evaluateEmergencyStop } from "../policy/evaluate-emergency-stop.js";

export function emergencyStopGuard() {
  const evaluation = evaluateEmergencyStop();
  if (evaluation.active) {
    return {
      remote_side_effect_allowed: false,
      decision: "EMERGENCY_STOP_ACTIVE"
    };
  }
  return {
    remote_side_effect_allowed: true,
    decision: "ADMISSIBLE"
  };
}
