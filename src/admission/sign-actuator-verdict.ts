import crypto from "node:crypto";

export function signActuatorVerdict(input: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");
}
