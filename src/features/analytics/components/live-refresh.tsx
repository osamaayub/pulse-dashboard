"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

const REFRESH_INTERVAL_MS = 30_000;

export function LiveRefresh() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const refreshing = useRef(false);

  const refresh = useCallback(() => {
    if (refreshing.current) return;
    refreshing.current = true;
    startTransition(() => router.refresh());
  }, [router]);

  useEffect(() => {
    if (!pending && refreshing.current) {
      refreshing.current = false;
      setUpdatedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    }
  }, [pending]);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [enabled, refresh]);

  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-panel px-2 py-1.5">
      <span className="inline-flex items-center gap-1.5 text-xs text-muted" aria-live="polite">
        <span className={`size-2 rounded-full ${enabled ? "bg-up" : "bg-muted/50"}`} aria-hidden />
        {pending ? "Updating" : !enabled ? "Paused" : updatedAt ? `Updated ${updatedAt}` : "Live"}
      </span>
      <button
        type="button"
        onClick={() => setEnabled((current) => !current)}
        className="min-h-8 rounded-md px-2 text-xs font-medium text-muted outline-none hover:bg-canvas hover:text-ink focus-visible:ring-2 focus-visible:ring-brand"
        aria-label={enabled ? "Pause automatic updates" : "Resume automatic updates"}
        title={enabled ? "Pause automatic updates" : "Resume automatic updates"}
      >
        {enabled ? "Pause" : "Resume"}
      </button>
      <button
        type="button"
        onClick={refresh}
        disabled={pending}
        className="grid size-8 place-items-center rounded-md text-muted outline-none hover:bg-canvas hover:text-ink focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
        aria-label="Refresh dashboard"
        title="Refresh dashboard"
      >
        <svg viewBox="0 0 24 24" className={`size-4 ${pending ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7v5h-5M4 17v-5h5m-4.2-3A8 8 0 0 1 18.2 6L20 12M4 12l1.8 6A8 8 0 0 0 19.2 15" />
        </svg>
      </button>
    </div>
  );
}
