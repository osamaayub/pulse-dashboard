import Link from "next/link";
import type { Status } from "@/lib/params";
import { pct } from "@/lib/format";

export function Panel({ title, action, children, className = "" }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-panel p-5 ${className}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const STATUS_STYLE: Record<Status, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  paid: "bg-brand-soft text-brand ring-indigo-200",
  shipped: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  refunded: "bg-slate-100 text-slate-600 ring-slate-200",
};
export function StatusBadge({ status }: { status: Status }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${STATUS_STYLE[status]}`}>{status}</span>;
}

export function Delta({ value, invert = false }: { value: number; invert?: boolean }) {
  const good = invert ? value <= 0 : value >= 0;
  return (
    <span className={`num inline-flex items-center gap-0.5 text-sm font-medium ${good ? "text-up" : "text-down"}`}>
      <span aria-hidden>{value >= 0 ? "▲" : "▼"}</span>
      {pct(value)}
    </span>
  );
}

export function PillLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand ${active ? "bg-ink text-white" : "text-muted hover:bg-white hover:text-ink"}`}
    >
      {children}
    </Link>
  );
}
