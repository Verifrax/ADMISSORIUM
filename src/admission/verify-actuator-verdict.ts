import { signActuatorVerdict } from "./sign-actuator-verdict.js";

export function verifyActuatorVerdict(input: unknown, signature: string) {
  return signActuatorVerdict(input) === signature;
}
