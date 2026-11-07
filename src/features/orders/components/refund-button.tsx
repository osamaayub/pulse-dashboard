"use client";

import { useActionState, useState } from "react";
import { refundOrder, type ActionResult } from "../actions";

/** Refunds need two clicks: the first asks, the second does it. No browser pop-up. */
export function RefundButton({ id }: { id: number }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(refundOrder, null);
  const [asking, setAsking] = useState(false);
  if (state?.ok) return <span className="text-sm font-medium text-muted">Refunded</span>;
  if (!asking)
    return (
      <button type="button" onClick={() => setAsking(true)} className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-down outline-none hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand">
        Refund
      </button>
    );
  return (
    <form action={action} className="inline-flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      {state && !state.ok && <span className="text-xs text-down">{state.error}</span>}
      <span className="text-sm text-muted">Refund this order?</span>
      <button disabled={pending} className="rounded-lg bg-down px-3 py-1.5 text-sm font-medium text-white outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50">
        {pending ? "Refunding…" : "Yes, refund"}
      </button>
      <button type="button" onClick={() => setAsking(false)} className="rounded-lg px-2 py-1.5 text-sm text-muted hover:text-ink">Cancel</button>
    </form>
  );
}
