"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview", icon: "M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" },
  { href: "/orders", label: "Orders", icon: "M7 4h10l1 4H6l1-4Zm-1 6h12l-1 10H7L6 10Zm4 3v4m4-4v4" },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="bg-side text-white lg:sticky lg:top-0 lg:h-dvh">
      <div className="flex items-center gap-3 px-5 py-4 lg:py-6">
        <span className="grid size-9 place-items-center rounded-xl bg-brand font-bold">P</span>
        <div>
          <p className="font-semibold leading-tight">Pulse</p>
          <p className="text-xs text-white/55">Northwind Outfitters</p>
        </div>
      </div>
      <nav className="flex gap-1 px-3 pb-3 lg:flex-col lg:pb-0" aria-label="Main">
        {NAV.map((n) => {
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/70 ${active ? "bg-white/12 text-white" : "text-white/65 hover:bg-white/6 hover:text-white"}`}
            >
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden><path d={n.icon} /></svg>
              {n.label}
            </Link>
          );
        })}
      </nav>
      <p className="hidden px-6 pt-8 text-xs leading-relaxed text-white/45 lg:block">Demo store. Data resets when the server restarts.</p>
    </aside>
  );
}
