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
  { href: "/admin", label: "Admin", icon: "M12 2a3 3 0 0 0-3 3c0 .7.24 1.35.64 1.86A6.98 6.98 0 0 0 5 13v2h14v-2a6.98 6.98 0 0 0-4.64-6.14C14.76 6.35 15 5.7 15 5a3 3 0 0 0-3-3Zm-6 15v2h12v-2H6Zm2 4v1h8v-1H8Z" },
];

export function Sidebar({ resetHours }: { resetHours: number }) {
  return (
    <aside className="sticky top-0 z-20 bg-side text-white lg:h-dvh">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5 lg:py-6">
        <span className="grid size-9 place-items-center rounded-xl bg-brand font-bold">P</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight">Pulse</p>
          <p className="truncate text-xs text-white/55">Northwind Outfitters</p>
        </div>
        <div className="lg:hidden">
          <ResetDemo hours={resetHours} compact />
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
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 gap-1 border-t border-white/10 bg-side px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(13,19,36,0.12)] lg:static lg:flex lg:flex-col lg:border-0 lg:bg-transparent lg:px-3 lg:pb-0 lg:pt-0 lg:shadow-none" aria-label="Main">
      {NAV.map((n) => {
        const active = path !== null && (n.href === "/" ? path === "/" : path.startsWith(n.href));
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[11px] font-medium outline-none transition-colors lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-2 lg:text-sm focus-visible:ring-2 focus-visible:ring-white/70 ${active ? "bg-white/12 text-white" : "text-white/65 hover:bg-white/6 hover:text-white"}`}
          >
            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden><path d={n.icon} /></svg>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
