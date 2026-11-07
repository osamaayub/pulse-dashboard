import Link from "next/link";
import { Delta, Panel, PillLink } from "@/components/ui";
import { StatusBadge } from "@/features/orders/components/status-badge";
import { recentOrders } from "@/features/orders/queries";
import { money, num, shortDate } from "@/lib/format";
import { getKpis, getRevenueSeries, getSalesByCategory, getTopProducts } from "../queries";
import { delta, RANGES, type Range } from "../range";
import { CategoryChart, RevenueChart } from "./charts";

const LABEL: Record<Range, string> = { "7d": "7 days", "30d": "30 days", "90d": "90 days", "12m": "12 months" };

export async function Overview({ range }: { range: Range }) {
  // Every query starts at the same time: the page waits for the slowest one, not the sum of all of them.
  const [{ cur, prev }, series, cats, top, recent] = await Promise.all([getKpis(range), getRevenueSeries(range), getSalesByCategory(range), getTopProducts(range), recentOrders()]);
  const kpis = [
    { label: "Revenue", value: money(cur.revenue), d: delta(cur.revenue, prev.revenue) },
    { label: "Orders", value: num(cur.orders), d: delta(cur.orders, prev.orders) },
    { label: "Average order", value: money(cur.aov), d: delta(cur.aov, prev.aov) },
    { label: "New customers", value: num(cur.newCustomers), d: delta(cur.newCustomers, prev.newCustomers) },
  ];
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted">How the store did in the last {LABEL[range]}, compared with the {LABEL[range]} before.</p>
        </div>
        <nav className="flex gap-1 rounded-xl bg-[#e8ecf3] p-1" aria-label="Date range">
          {(Object.keys(RANGES) as Range[]).map((r) => (
            <PillLink key={r} href={`/?range=${r}`} active={r === range}>{r}</PillLink>
          ))}
        </nav>
      </header>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-line bg-panel p-5">
            <p className="text-sm text-muted">{k.label}</p>
            <p className="num mt-2 text-[28px] font-semibold tracking-tight">{k.value}</p>
            <div className="mt-1 flex items-center gap-2"><Delta value={k.d} /><span className="text-xs text-muted">vs previous</span></div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Panel title="Revenue"><RevenueChart data={series} /></Panel>
        <Panel title="Revenue by category"><CategoryChart data={cats} /></Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Top products">
          <ol className="divide-y divide-line">
            {top.map((p, i) => (
              <li key={p.name} className="flex items-center gap-3 py-2.5">
                <span className="num w-5 text-sm text-muted">{i + 1}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{p.name}</p><p className="text-xs text-muted">{p.category} · {num(p.units)} sold</p></div>
                <span className="num text-sm font-semibold">{money(p.revenue)}</span>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="Latest orders" action={<Link href="/orders" className="text-sm font-medium text-brand hover:underline">View all</Link>}>
          <ul className="divide-y divide-line">
            {recent.map((o) => (
              <li key={o.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="num w-16 text-muted">#{o.id}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{o.customer}</span>
                <StatusBadge status={o.status} />
                <span className="num w-20 text-right font-semibold">{money(o.totalCents)}</span>
                <span className="hidden w-14 text-right text-muted sm:block">{shortDate(o.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="skeleton h-12 w-80" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-32" />)}</div>
      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]"><div className="skeleton h-[22rem]" /><div className="skeleton h-[22rem]" /></div>
    </div>
  );
}
