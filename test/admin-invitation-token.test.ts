import { describe, expect, it } from "vitest";
import {
  ADMIN_INVITATION_LIFETIME_MS,
  adminInvitationExpiresAt,
  createAdminInvitationToken,
  hashInvitationToken,
  validInvitationTokenShape,
} from "../src/lib/admin-invitation-token";

describe("administrator invitation tokens", () => {
  it("generates high-entropy URL-safe tokens and stores only a digest", () => {
    const token = createAdminInvitationToken();
    expect(validInvitationTokenShape(token)).toBe(true);
    expect(hashInvitationToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashInvitationToken(token)).not.toBe(token);
    expect(createAdminInvitationToken()).not.toBe(token);
  });

  it("rejects malformed tokens and applies the 24-hour expiration", () => {
    expect(validInvitationTokenShape("")).toBe(false);
    expect(validInvitationTokenShape("a".repeat(42))).toBe(false);
    expect(validInvitationTokenShape("a".repeat(43) + "=")).toBe(false);
    expect(adminInvitationExpiresAt(1_000).getTime()).toBe(1_000 + ADMIN_INVITATION_LIFETIME_MS);
    expect(ADMIN_INVITATION_LIFETIME_MS).toBe(24 * 60 * 60 * 1000);
  });
});
