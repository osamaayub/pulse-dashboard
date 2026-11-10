"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  ["Overview", "/admin"],
  ["Products", "/admin/products"],
  ["Inventory", "/admin/inventory"],
  ["Orders", "/admin/orders"],
  ["Customers", "/admin/customers"],
  ["Reports", "/admin/reports"],
  ["Activity", "/admin/activity"],
  ["Team", "/admin/team"],
] as const;

export function AdminSectionNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-line/80 bg-white/80 p-1.5 shadow-[0_5px_20px_-18px_rgba(13,19,36,0.35)] backdrop-blur" aria-label="Admin sections">
      {SECTIONS.map(([label, href]) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-10 shrink-0 items-center rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${active ? "bg-[#17182f] text-white shadow-sm" : "text-muted hover:bg-canvas hover:text-ink"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
