import crypto from "node:crypto";

export function signWebhookBody(secret: string, body: string) {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}

export function verifyWebhookSignature(secret: string, body: string, signature: string) {
  return signWebhookBody(secret, body) === signature;
}
