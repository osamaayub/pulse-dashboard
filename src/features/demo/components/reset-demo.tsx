"use client";

import { useActionState } from "react";
import { resetDemoData, type ResetResult } from "../actions";

/** Sidebar footer: explains that this is sample data and lets anyone put it back to normal. */
export function ResetDemo({ hours, compact = false }: { hours: number; compact?: boolean }) {
  const [state, action, pending] = useActionState<ResetResult | null>(() => resetDemoData(), null);
  if (compact)
    return (
      <form action={action} className="flex items-center gap-2">
        <span role="status" className={`text-xs ${state?.ok ? "text-emerald-300" : "text-amber-300"}`}>{state ? (state.ok ? "Reset ✓" : "Try later") : null}</span>
        <button disabled={pending} title={state && !state.ok ? state.error : `Sample store. Resets every ${hours === 24 ? "day" : `${hours} hours`}.`} className="min-h-9 rounded-lg border border-white/15 px-3 text-xs font-medium text-white/80 outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-50">
          {pending ? "Resetting…" : "Reset demo"}
        </button>
      </form>
    );
  return (
    <div className="space-y-2 text-xs leading-relaxed text-white/50">
      <p>Sample store. Try anything: ship, refund, export.{hours > 0 && ` It resets every ${hours === 24 ? "day" : `${hours} hours`}.`}</p>
      <form action={action}>
        <button disabled={pending} className="rounded-md border border-white/15 px-2.5 py-1 font-medium text-white/80 outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-50">
          {pending ? "Resetting…" : "Reset demo data"}
        </button>
      </form>
      <p role="status" className={state?.ok ? "text-emerald-300" : "text-amber-300"}>
        {state ? (state.ok ? "Done. Fresh sample data is loaded." : state.error) : null}
      </p>
    </div>
  );
}
