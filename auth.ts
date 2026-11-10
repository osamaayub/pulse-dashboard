import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import { hasAdminEmails, isAdminEmail } from "@/lib/admin-auth";
import { runtimeEnv } from "@/lib/runtime-env";

const INVITATION_COOKIE = "pulse_admin_invite";

export function isAdminAuthConfigured() {
  return Boolean(
    runtimeEnv("AUTH_SECRET") &&
    runtimeEnv("AUTH_GOOGLE_ID") &&
    runtimeEnv("AUTH_GOOGLE_SECRET") &&
    hasAdminEmails(),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: runtimeEnv("AUTH_GOOGLE_ID") || "not-configured",
      clientSecret: runtimeEnv("AUTH_GOOGLE_SECRET") || "not-configured",
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (typeof credentials.email !== "string" || typeof credentials.password !== "string") return null;
        const { authenticateAdminPassword } = await import("@/server/admin-password");
        const email = await authenticateAdminPassword(credentials.email, credentials.password);
        return email ? { id: email, email } : null;
      },
    }),
  ],
  secret: runtimeEnv("AUTH_SECRET"),
  trustHost: runtimeEnv("AUTH_TRUST_HOST") === "true" || process.env.NODE_ENV === "development" || Boolean(runtimeEnv("VERCEL")) || Boolean(runtimeEnv("NETLIFY")),
  pages: { signIn: "/admin/sign-in" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials") return Boolean(user.email);
      const cookieStore = await cookies();
      const invitationToken = cookieStore.get(INVITATION_COOKIE)?.value;
      if (account?.provider !== "google" || profile?.email_verified !== true || !user.email) {
        if (invitationToken) cookieStore.delete(INVITATION_COOKIE);
        return false;
      }
      if (isAdminEmail(user.email)) {
        if (invitationToken) cookieStore.delete(INVITATION_COOKIE);
        return true;
      }
      const { activeAdmin } = await import("@/server/admin-invitations");
      if (await activeAdmin(user.email)) {
        if (invitationToken) cookieStore.delete(INVITATION_COOKIE);
        return true;
      }
      if (!invitationToken) return false;
      const { acceptAdminInvitation } = await import("@/server/admin-invitations");
      const accepted = await acceptAdminInvitation(user.email, invitationToken);
      cookieStore.delete(INVITATION_COOKIE);
      return accepted;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const { activeAdmin } = await import("@/server/admin-invitations");
        token.isAdmin = isAdminEmail(user.email) || Boolean(await activeAdmin(user.email));
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.isAdmin = token.isAdmin === true;
      return session;
    },
  },
});
