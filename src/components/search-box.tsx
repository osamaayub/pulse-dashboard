"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

/** Updates ?q= 300 ms after the user stops typing. The URL is the state, so results can be shared and survive a refresh. */
export function SearchBox({ defaultValue, label = "Search", placeholder = "Search" }: { defaultValue: string; label?: string; placeholder?: string }) {
  const router = useRouter(), path = usePathname(), params = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [pending, start] = useTransition();
  useEffect(() => {
    if (value === (params.get("q") ?? "")) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (value) next.set("q", value); else next.delete("q");
      next.delete("page");
      start(() => router.replace(`${path}?${next}`, { scroll: false }));
    }, 300);
    return () => clearTimeout(t);
  }, [value, params, path, router]);
  return (
    <label className="relative block w-full sm:w-72">
      <span className="sr-only">{label}</span>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-9 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      {pending && <span className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-label="Searching" />}
    </label>
  );
}
