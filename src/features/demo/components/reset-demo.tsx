"use client";

import { useActionState } from "react";
import { resetDemoData, type ResetResult } from "../actions";

/** Sidebar footer: explains that this is sample data and lets anyone put it back to normal. */
export function ResetDemo({ hours }: { hours: number }) {
  const [state, action, pending] = useActionState<ResetResult | null>(() => resetDemoData(), null);
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
