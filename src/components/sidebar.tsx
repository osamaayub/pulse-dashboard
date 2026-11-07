"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { ResetDemo } from "@/features/demo/components/reset-demo";

const NAV = [
  { href: "/", label: "Overview", icon: "M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" },
  { href: "/orders", label: "Orders", icon: "M7 4h10l1 4H6l1-4Zm-1 6h12l-1 10H7L6 10Zm4 3v4m4-4v4" },
  { href: "/customers", label: "Customers", icon: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 10a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4-6.3" },
  { href: "/products", label: "Products", icon: "M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Zm0 0v18M3 7.5l9 4.5 9-4.5" },
];

export function Sidebar({ resetHours }: { resetHours: number }) {
  return (
    <aside className="bg-side text-white lg:sticky lg:top-0 lg:h-dvh">
      <div className="flex items-center gap-3 px-5 py-4 lg:py-6">
        <span className="grid size-9 place-items-center rounded-xl bg-brand font-bold">P</span>
        <div>
          <p className="font-semibold leading-tight">Pulse</p>
          <p className="text-xs text-white/55">Northwind Outfitters</p>
        </div>
      </div>
      {/* The highlighted link depends on the URL, so it streams in; until then the same links show without a highlight. */}
      <Suspense fallback={<NavLinks path={null} />}>
        <CurrentNav />
      </Suspense>
      <div className="hidden px-6 pt-8 lg:block">
        <ResetDemo hours={resetHours} />
      </div>
    </aside>
  );
}

function CurrentNav() {
  return <NavLinks path={usePathname()} />;
}

function NavLinks({ path }: { path: string | null }) {
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Main">
      {NAV.map((n) => {
        const active = path !== null && (n.href === "/" ? path === "/" : path.startsWith(n.href));
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
  );
}
