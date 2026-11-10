"use client";

import { useActionState } from "react";
import { createAdminInvitation, revokeAdminInvitation } from "../actions";

const fieldClass = "mt-1 min-h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export function AdminInvitationForm() {
  const [state, action, pending] = useActionState(createAdminInvitation, null);
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm font-medium">Administrator email
        <input name="email" type="email" required maxLength={254} autoComplete="email" className={fieldClass} />
      </label>
      <button disabled={pending} className="min-h-10 rounded-lg bg-ink px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
        {pending ? "Creating…" : "Create invitation"}
      </button>
      {state && <p role={state.ok ? "status" : "alert"} className={`text-sm ${state.ok ? "text-up" : "text-down"}`}>{state.message}</p>}
      {state?.invitePath && (
        <label className="block text-xs font-medium text-muted">One-time invitation link
          <input readOnly value={new URL(state.invitePath, window.location.origin).toString()} onFocus={(event) => event.currentTarget.select()} className={fieldClass} />
        </label>
      )}
    </form>
  );
}

export function RevokeAdminInvitation({ id }: { id: number }) {
  const [state, action, pending] = useActionState(revokeAdminInvitation, null);
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="min-h-9 rounded-lg border border-line px-3 text-xs font-medium hover:bg-canvas disabled:opacity-50">
        {pending ? "Revoking…" : "Revoke"}
      </button>
      {state && <span role={state.ok ? "status" : "alert"} className={`text-xs ${state.ok ? "text-up" : "text-down"}`}>{state.message}</span>}
    </form>
  );
}
