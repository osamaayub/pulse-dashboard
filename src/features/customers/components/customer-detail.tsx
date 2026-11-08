import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel } from "@/components/ui";
import { StatusBadge } from "@/features/orders/components/status-badge";
import { longDate, money, num } from "@/lib/format";
import { getCustomer } from "../queries";

export async function CustomerDetail({ id }: { id: number }) {
  const c = await getCustomer(id);
  if (!c) notFound();
  const topSpend = c.categories[0]?.spent ?? 0;
  const stats = [
    { label: "Lifetime value", value: money(c.ltv) },
    { label: "Orders", value: num(c.orders) },
    { label: "Average order", value: money(c.aov) },
    { label: "Last order", value: c.lastOrder ? longDate(c.lastOrder) : "None yet" },
  ];
  return (
    <>
      <header>
        <Link href="/customers" className="text-sm text-muted hover:text-ink">← Customers</Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{c.name}</h1>
        <p className="mt-1 text-sm text-muted">
          <a href={`mailto:${c.email}`} className="hover:text-ink hover:underline">{c.email}</a> · {c.country} · Customer since {longDate(c.since)}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-panel p-5">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="num mt-2 text-2xl font-semibold tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title="Order history">
          {c.history.length ? (
            <ul className="divide-y divide-line">
              {c.history.map((o) => (
                <li key={o.id}>
                  <Link href={`/orders/${o.id}`} className="flex items-center gap-3 py-3 text-sm hover:bg-canvas/70">
                    <span className="num w-12 shrink-0 text-muted sm:w-16">#{o.id}</span>
                    <span className="num min-w-0 flex-1 truncate whitespace-nowrap text-muted">{longDate(o.createdAt)}</span>
                    <StatusBadge status={o.status} />
                    <span className="num w-16 shrink-0 text-right font-semibold sm:w-24">{money(o.totalCents)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-10 text-center text-sm text-muted">This customer hasn&apos;t ordered yet.</p>
          )}
        </Panel>
        <Panel title="What they buy">
          {c.categories.length ? (
            <ul className="space-y-3">
              {c.categories.map((k) => (
                <li key={k.category} className="text-sm">
                  <div className="flex justify-between"><span>{k.category}</span><span className="num font-medium">{money(k.spent)}</span></div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-canvas"><div className="h-full rounded-full bg-teal" style={{ width: `${(k.spent / topSpend) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No paid orders yet.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
