import { Panel } from "@/components/ui";
import { AdminInvitationForm, RevokeAdminInvitation } from "@/features/admin/components/invitation-controls";
import { pendingAdminInvitations } from "@/server/admin-invitations";
import { longDate } from "@/lib/format";

export const metadata = { title: "Administrator access" };

export default async function AdminTeamPage() {
  const invitations = await pendingAdminInvitations();
  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Administrator access</h1>
        <p className="mt-1 text-sm text-muted">Invite teammates with verified Google accounts. Links are single-use and expire after 24 hours.</p>
      </header>
      <Panel title="Invite an administrator">
        <AdminInvitationForm />
        <p className="mt-3 text-xs leading-relaxed text-muted">No email provider is configured. Copy the generated link and share it securely; it cannot be recovered after leaving this page.</p>
      </Panel>
      <Panel title={`Pending invitations · ${invitations.length}`}>
        {!invitations.length ? <p className="py-8 text-center text-sm text-muted">No pending invitations.</p> : (
          <ul className="divide-y divide-line">
            {invitations.map((invitation) => (
              <li key={invitation.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{invitation.email}</p>
                  <p className="text-xs text-muted">Expires {longDate(invitation.expiresAt)} at {invitation.expiresAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>
                </div>
                <RevokeAdminInvitation id={invitation.id} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
