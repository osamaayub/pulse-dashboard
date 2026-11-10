import { describe, expect, it } from "vitest";
import { hashAdminPassword, verifyAdminPassword } from "../src/lib/admin-password";

describe("administrator password hashing", () => {
  it("uses a salted scrypt hash and verifies only the matching password", async () => {
    const first = await hashAdminPassword("a-secure-passphrase-123");
    const second = await hashAdminPassword("a-secure-passphrase-123");
    expect(first).not.toBe(second);
    expect(first).toMatch(/^scrypt\$32768\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/);
    await expect(verifyAdminPassword("a-secure-passphrase-123", first)).resolves.toBe(true);
    await expect(verifyAdminPassword("a-different-passphrase", first)).resolves.toBe(false);
  });

  it("uses a dummy hash for missing accounts and rejects malformed stored hashes", async () => {
    await expect(verifyAdminPassword("arbitrary-password", null)).resolves.toBe(false);
    await expect(verifyAdminPassword("arbitrary-password", "not-a-hash")).resolves.toBe(false);
  });
});
