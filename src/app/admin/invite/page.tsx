import Link from "next/link";
import { isAdminAuthConfigured } from "@auth";
import { AdminAuthShell } from "@/components/admin-auth-shell";
import { pendingInvitation } from "@/server/admin-invitations";
import { beginAdminInviteSignIn } from "./actions";
import { InvitePasswordForm } from "./invite-password-form";

export const metadata = { title: "Accept administrator invitation", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export const instant = false;

export default async function AdminInvitePage({ searchParams }: PageProps<"/admin/invite">) {
  const { token } = await searchParams;
  if (!isAdminAuthConfigured()) {
    return (
      <AdminAuthShell eyebrow="Administrator access" title="Invitations aren't ready yet" description="Finish setting up administrator sign-in before accepting an invitation.">
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          Configure <code className="rounded bg-amber-100 px-1">AUTH_GOOGLE_ID</code>, <code className="rounded bg-amber-100 px-1">AUTH_GOOGLE_SECRET</code> and <code className="rounded bg-amber-100 px-1">ADMIN_EMAILS</code> in <code className="rounded bg-amber-100 px-1">.env.local</code>, then restart the app.
        </div>
        <Link href="/admin/sign-in?setup=required" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold text-ink transition hover:bg-canvas">Admin sign-in setup</Link>
      </AdminAuthShell>
    );
  }
  const inviteToken = typeof token === "string" ? token : "";
  const invitation = await pendingInvitation(inviteToken);
  return (
    <AdminAuthShell
      eyebrow="Administrator invitation"
      title={invitation ? "Join the workspace" : "Invitation unavailable"}
      description={invitation ? "Create your administrator account. Use a password or continue with your verified Google account." : "This invitation link can't be used. Ask an administrator to send you a new one."}
    >
        {!invitation ? (
          <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">This invitation is invalid, expired or has already been used.</div>
        ) : (
          <>
            <div className="mb-5 rounded-xl border border-[#e8e9f2] bg-[#f8f8fc] p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Invited email address</p>
              <p className="mt-1 break-all text-sm font-semibold text-ink">{invitation.email}</p>
            </div>
            <InvitePasswordForm token={inviteToken} />
            <div className="my-5 flex items-center gap-3 text-[10px] font-semibold tracking-[0.14em] text-muted"><span className="h-px flex-1 bg-line" />OR USE GOOGLE<span className="h-px flex-1 bg-line" /></div>
            <form action={async () => {
              "use server";
              await beginAdminInviteSignIn(inviteToken);
            }}>
              <button className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink shadow-sm transition hover:border-[#c9cce0] hover:bg-[#fafaff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
                <svg viewBox="0 0 48 48" className="size-5" aria-hidden><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.74 7.18l7.73 6C44.43 37.86 46.98 31.7 46.98 24.55Z" /><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" /></svg>
                Continue with Google
              </button>
            </form>
          </>
        )}
    </AdminAuthShell>
  );
}
