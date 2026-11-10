import "server-only";

import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { hashInvitationToken, validInvitationTokenShape } from "@/lib/admin-invitation-token";
import { getDb } from "./db";
import { adminInvitations, adminUsers, auditLog } from "./schema";

export async function pendingAdminInvitations() {
  const db = await getDb();
  return db.select({
    id: adminInvitations.id,
    email: adminInvitations.email,
    expiresAt: adminInvitations.expiresAt,
    createdAt: adminInvitations.createdAt,
  }).from(adminInvitations)
    .where(and(isNull(adminInvitations.acceptedAt), gt(adminInvitations.expiresAt, new Date())))
    .orderBy(desc(adminInvitations.createdAt));
}

export async function activeAdmin(email: string) {
  const db = await getDb();
  const normalized = email.trim().toLowerCase();
  const [admin] = await db.select({ email: adminUsers.email }).from(adminUsers)
    .where(and(eq(adminUsers.email, normalized), eq(adminUsers.isActive, true)))
    .limit(1);
  return admin?.email ?? null;
}

export async function pendingInvitation(token: string) {
  if (!validInvitationTokenShape(token)) return null;
  const db = await getDb();
  const [invitation] = await db.select({
    id: adminInvitations.id,
    email: adminInvitations.email,
    expiresAt: adminInvitations.expiresAt,
  }).from(adminInvitations).where(and(
    eq(adminInvitations.tokenHash, hashInvitationToken(token)),
    isNull(adminInvitations.acceptedAt),
    gt(adminInvitations.expiresAt, new Date()),
  )).limit(1);
  return invitation ?? null;
}

export async function acceptAdminInvitation(email: string, token: string, passwordHash: string | null = null) {
  if (!validInvitationTokenShape(token)) return false;
  const normalized = email.trim().toLowerCase();
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [invitation] = await tx.select({
      id: adminInvitations.id,
      email: adminInvitations.email,
      invitedByEmail: adminInvitations.invitedByEmail,
    }).from(adminInvitations).where(and(
      eq(adminInvitations.tokenHash, hashInvitationToken(token)),
      eq(adminInvitations.email, normalized),
      isNull(adminInvitations.acceptedAt),
      gt(adminInvitations.expiresAt, new Date()),
    )).for("update");
    if (!invitation) return false;

    const [existingAdmin] = await tx.select({ isActive: adminUsers.isActive })
      .from(adminUsers).where(eq(adminUsers.email, normalized)).for("update");
    if (existingAdmin?.isActive) return false;
    await tx.insert(adminUsers).values({ email: normalized, invitedByEmail: invitation.invitedByEmail, passwordHash })
      .onConflictDoUpdate({
        target: adminUsers.email,
        set: {
          invitedByEmail: invitation.invitedByEmail,
          isActive: true,
          passwordHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    const [accepted] = await tx.update(adminInvitations)
      .set({ acceptedAt: new Date() })
      .where(and(eq(adminInvitations.id, invitation.id), isNull(adminInvitations.acceptedAt)))
      .returning({ id: adminInvitations.id });
    if (!accepted) return false;
    await tx.insert(auditLog).values({
      actorEmail: normalized,
      action: "admin.invitation_accepted",
      entityType: "admin",
      entityId: normalized,
      summary: `${normalized} accepted administrator invitation #${invitation.id}.`,
    });
    return true;
  });
}
