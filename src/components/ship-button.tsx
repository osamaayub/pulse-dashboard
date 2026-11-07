"use client";

import { useActionState } from "react";
import { markShipped, type ShipResult } from "@/server/actions";

export function ShipButton({ id }: { id: number }) {
  const [state, action, pending] = useActionState<ShipResult | null, FormData>(markShipped, null);
  if (state?.ok) return <span className="text-xs font-medium text-up">Shipped ✓</span>;
  return (
    <form action={action} className="inline-flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      {state && !state.ok && <span className="text-xs text-down">{state.error}</span>}
      <button disabled={pending} className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50">
        {pending ? "Shipping…" : "Mark shipped"}
      </button>
    </form>
  );
}
