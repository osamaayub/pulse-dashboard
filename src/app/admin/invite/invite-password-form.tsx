"use client";

import { useActionState } from "react";
import Link from "next/link";
import { acceptAdminInviteWithPassword } from "./actions";

const fieldClass = "mt-2 min-h-12 w-full rounded-xl border border-[#dfe2ec] bg-[#fbfbfd] px-3.5 text-sm text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10";

export function InvitePasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptAdminInviteWithPassword, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <label className="block text-sm font-medium text-ink">Create password
        <input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" className={fieldClass} />
      </label>
      <label className="block text-sm font-medium text-ink">Confirm password
        <input name="confirmPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" className={fieldClass} />
      </label>
      <button disabled={pending} className="min-h-12 w-full rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(79,70,229,0.8)] outline-none transition hover:bg-[#4338ca] focus-visible:ring-4 focus-visible:ring-brand/20 disabled:opacity-50">
        {pending ? "Creating account…" : "Create account with password"}
      </button>
      {state && <p role={state.ok ? "status" : "alert"} className={`rounded-lg px-3 py-2.5 text-sm ${state.ok ? "bg-emerald-50 text-up" : "bg-red-50 text-down"}`}>{state.message}</p>}
      {state?.ok && <Link href="/admin/sign-in" className="inline-block text-sm font-medium text-brand hover:underline">Go to administrator sign in</Link>}
    </form>
  );
}
