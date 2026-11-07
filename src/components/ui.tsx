import Link from "next/link";
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
