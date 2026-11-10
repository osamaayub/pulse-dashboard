import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { verifyAdminPassword } from "@/lib/admin-password";
import { getDb } from "./db";
import { adminUsers } from "./schema";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export async function authenticateAdminPassword(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  if (normalized.length > 254 || Buffer.byteLength(password, "utf8") > 1024) {
    await verifyAdminPassword(password.slice(0, 1024), null);
    return null;
  }

  const db = await getDb();
  const [admin] = await db.select({
    email: adminUsers.email,
    isActive: adminUsers.isActive,
    passwordHash: adminUsers.passwordHash,
    lockedUntil: adminUsers.lockedUntil,
  }).from(adminUsers).where(eq(adminUsers.email, normalized)).limit(1);

  const passwordMatches = await verifyAdminPassword(password, admin?.passwordHash);
  const now = new Date();
  const isLocked = Boolean(admin?.lockedUntil && admin.lockedUntil > now);
  if (!admin || !admin.isActive || !admin.passwordHash || !passwordMatches || isLocked) {
    if (admin?.isActive) {
      await db.update(adminUsers).set({
        failedLoginAttempts: sql`CASE WHEN ${adminUsers.lockedUntil} IS NOT NULL AND ${adminUsers.lockedUntil} <= ${now} THEN 1 ELSE ${adminUsers.failedLoginAttempts} + 1 END`,
        lockedUntil: sql`CASE WHEN ${adminUsers.lockedUntil} > ${now} THEN ${adminUsers.lockedUntil} WHEN ${adminUsers.failedLoginAttempts} >= ${MAX_FAILED_ATTEMPTS - 1} THEN ${new Date(now.getTime() + LOCKOUT_MS)} ELSE NULL END`,
      }).where(and(eq(adminUsers.email, normalized), eq(adminUsers.isActive, true)));
    }
    return null;
  }

  await db.update(adminUsers).set({ failedLoginAttempts: 0, lockedUntil: null })
    .where(and(eq(adminUsers.email, normalized), eq(adminUsers.isActive, true)));
  return admin.email;
}
