import "server-only";

import { auth, isAdminAuthConfigured } from "@auth";
import { isAdminEmail } from "@/lib/admin-auth";
import { activeAdmin } from "./admin-invitations";
import { database } from "./env";

export async function currentAdminEmail() {
  if (!isAdminAuthConfigured() && database.source === "demo") return "demo@pulse.local";
  const session = await auth();
  const email = session?.user?.email;
  if (email && (isAdminEmail(email) || (session.user.isAdmin && await activeAdmin(email)))) return email;
  return null;
}

/** Every admin mutation checks the session here; the demo remains writable for local exploration. */
export async function requireAdmin() {
  const email = await currentAdminEmail();
  if (email) return email;
  throw new Error("Administrator access is required.");
}
