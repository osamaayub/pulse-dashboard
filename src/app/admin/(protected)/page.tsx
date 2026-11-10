import Link from "next/link";
import { adminCounts } from "@/features/admin/queries";
import { num } from "@/lib/format";

export const metadata = { title: "Admin overview" };
export const instant = false;

const LINKS = [
  { title: "Products", href: "/admin/products", description: "Create, update and archive your catalog.", icon: "M12 3 3.5 7.5 12 12l8.5-4.5L12 3ZM3.5 7.5v9L12 21l8.5-4.5v-9M12 12v9" },
  { title: "Inventory", href: "/admin/inventory", description: "Adjust stock and catch low inventory early.", icon: "M4 7h16v13H4zM8 7V4h8v3m-8 5h8" },
  { title: "Orders", href: "/admin/orders", description: "Review and move orders through fulfillment.", icon: "M5 4h14v16H5zM8 8h8m-8 4h8m-8 4h5" },
  { title: "Customers", href: "/admin/customers", description: "Manage customer records and account status.", icon: "M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 18.5V20m6-10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm6-6a3.5 3.5 0 0 1 0 6.8M17 14a4.5 4.5 0 0 1 3 4.3V20" },
  { title: "Reports", href: "/admin/reports", description: "Understand revenue trends and export data.", icon: "M4 19V5m0 14h17M8 15l3-4 3 2 5-7" },
  { title: "Activity log", href: "/admin/activity", description: "See a history of administrator changes.", icon: "M12 8v4l3 2m6-2a9 9 0 1 1-2.64-6.36L21 8m0-5v5h-5" },
];

export default async function AdminOverviewPage() {
  const counts = await adminCounts();
  const stats: { label: string; value: number }[] = [
    { label: "Active products", value: counts.products },
    { label: "Low stock", value: counts.lowStock },
    { label: "Active customers", value: counts.customers },
    { label: "Total orders", value: counts.orders },
  ];
  return (
    <>
      <header className="flex flex-col gap-4 rounded-[22px] border border-line/80 bg-white p-5 shadow-[0_8px_24px_-20px_rgba(13,19,36,0.3)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Operations center</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Admin overview</h1>
          <p className="mt-1 text-sm text-muted">A quick pulse check on the store and its daily operations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/orders" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-line px-3.5 text-sm font-semibold transition hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            View orders <span aria-hidden>→</span>
          </Link>
          <Link href="/admin/products" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-brand px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4338ca] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
            <span className="text-lg leading-none" aria-hidden>+</span> Add product
          </Link>
        </div>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {stats.map(({ label, value }, index) => (
          <div key={label} className="relative min-w-0 overflow-hidden rounded-[20px] border border-line/80 bg-white p-4 shadow-[0_8px_24px_-20px_rgba(13,19,36,0.3)] sm:p-5">
            <span className={`mb-4 grid size-9 place-items-center rounded-xl ${index === 1 && value > 0 ? "bg-amber-50 text-amber-700" : "bg-brand-soft text-brand"}`} aria-hidden>
              {index === 0 && <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16v13H4zM8 7V4h8v3" /></svg>}
              {index === 1 && <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3 2.8 20h18.4L12 3Z" /><path d="M12 9v5m0 3h.01" /></svg>}
              {index === 2 && <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 18.5V20m6-10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm6-6a3.5 3.5 0 0 1 0 6.8M17 14a4.5 4.5 0 0 1 3 4.3V20" /></svg>}
              {index === 3 && <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 4h14v16H5zM8 8h8m-8 4h8m-8 4h5" /></svg>}
            </span>
            <p className="text-xs font-medium text-muted sm:text-sm">{label}</p>
            <p className="num mt-1.5 text-2xl font-semibold tracking-tight sm:text-[28px]">{num(value)}</p>
            {index === 1 && value > 0 && <p className="mt-1 text-[11px] font-medium text-amber-700">Needs attention</p>}
          </div>
        ))}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div><h2 className="text-lg font-semibold tracking-tight">Manage your store</h2><p className="mt-1 text-sm text-muted">Shortcuts to the tools you use every day.</p></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {LINKS.map(({ title, href, description, icon }) => (
          <Link key={href} href={href} className="group rounded-[20px] border border-line/80 bg-white p-4 shadow-[0_8px_24px_-20px_rgba(13,19,36,0.3)] transition hover:-translate-y-0.5 hover:border-[#d3d5ec] hover:shadow-[0_16px_30px_-22px_rgba(13,19,36,0.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-10 place-items-center rounded-xl bg-[#f0f1ff] text-brand transition group-hover:bg-brand group-hover:text-white" aria-hidden>
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
              </span>
              <span className="grid size-8 place-items-center rounded-full text-muted transition group-hover:bg-brand-soft group-hover:text-brand" aria-hidden>↗</span>
            </div>
            <h3 className="mt-5 font-semibold tracking-tight">{title}</h3>
            <p className="mt-1 text-sm leading-5 text-muted">{description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand">Open {title.toLowerCase()} <span aria-hidden>→</span></span>
          </Link>
        ))}
      </div>
    </>
  );
}
