import { createHash, randomBytes } from "node:crypto";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
export const ADMIN_INVITATION_LIFETIME_MS = 24 * 60 * 60 * 1000;

export function createAdminInvitationToken() {
  return randomBytes(32).toString("base64url");
}

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function validInvitationTokenShape(token: string) {
  return TOKEN_PATTERN.test(token);
}

export function adminInvitationExpiresAt(now = Date.now()) {
  return new Date(now + ADMIN_INVITATION_LIFETIME_MS);
}
