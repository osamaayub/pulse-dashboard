import Link from "next/link";
import { Delta, Panel, PillLink } from "@/components/ui";
import { StatusBadge } from "@/features/orders/components/status-badge";
import { recentOrders, statusCounts } from "@/features/orders/queries";
import { STATUSES, type Status } from "@/features/orders/params";
import { money, num, shortDate } from "@/lib/format";
import { getKpis, getRevenueSeries, getSalesByCategory, getTopProducts } from "../queries";
import { delta, RANGES, type Range } from "../range";
import { CategoryChart, RevenueChart } from "./charts";
import { LiveRefresh } from "./live-refresh";

const LABEL: Record<Range, string> = { "7d": "7 days", "30d": "30 days", "90d": "90 days", "12m": "12 months" };
const PIPELINE_COLOR: Record<Status, string> = {
  pending: "bg-amber-500",
  paid: "bg-brand",
  shipped: "bg-up",
  refunded: "bg-slate-400",
};

export async function Overview({ range }: { range: Range }) {
  // Every query starts at the same time: the page waits for the slowest one, not the sum of all of them.
  const [{ cur, prev }, series, cats, top, recent, counts] = await Promise.all([getKpis(range), getRevenueSeries(range), getSalesByCategory(range), getTopProducts(range), recentOrders(), statusCounts()]);
  const totalOrders = counts.reduce((total, item) => total + item.n, 0);
  const pipeline = STATUSES.map((status) => ({
    status,
    count: counts.find((item) => item.status === status)?.n ?? 0,
  }));
  const kpis = [
    { label: "Revenue", value: money(cur.revenue), d: delta(cur.revenue, prev.revenue) },
    { label: "Orders", value: num(cur.orders), d: delta(cur.orders, prev.orders) },
    { label: "Average order", value: money(cur.aov), d: delta(cur.aov, prev.aov) },
    { label: "New customers", value: num(cur.newCustomers), d: delta(cur.newCustomers, prev.newCustomers) },
  ];
  const kpiIcons = [
    "M3 12h4l3-8 4 16 3-8h4",
    "M5 4h14v16H5zM8 8h8m-8 4h8m-8 4h5",
    "M12 3v18m5-14H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
    "M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 18.5V20m6-10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm6-6a3.5 3.5 0 0 1 0 6.8M17 14a4.5 4.5 0 0 1 3 4.3V20",
  ];
  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Store performance</p>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted">How the store did in the last {LABEL[range]}, compared with the {LABEL[range]} before.</p>
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:justify-end">
          <nav className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-[#e8ecf3] p-1" aria-label="Date range">
            {(Object.keys(RANGES) as Range[]).map((r) => (
              <PillLink key={r} href={`/?range=${r}`} active={r === range}>{r}</PillLink>
            ))}
          </nav>
          <LiveRefresh />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {kpis.map((k, index) => (
          <div key={k.label} className="min-w-0 rounded-[20px] border border-line/80 bg-white p-4 shadow-[0_8px_24px_-20px_rgba(13,19,36,0.3)] sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted sm:text-sm">{k.label}</p>
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand" aria-hidden>
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={kpiIcons[index]} /></svg>
              </span>
            </div>
            <p className="num mt-3 truncate text-2xl font-semibold tracking-tight sm:text-[28px]">{k.value}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-2"><Delta value={k.d} /><span className="text-xs text-muted">vs previous</span></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Panel title="Sales over time"><RevenueChart data={series} /></Panel>
        <Panel title="Revenue by category"><CategoryChart data={cats} /></Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,0.9fr)]">
        <Panel title="Top products" action={<Link href={`/products${range === "30d" ? "" : `?range=${range}`}`} className="text-sm font-medium text-brand hover:underline">View all</Link>}>
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
                <Link href={`/orders/${o.id}`} className="num w-12 shrink-0 font-medium text-brand hover:underline sm:w-16">#{o.id}</Link>
                <span className="min-w-0 flex-1 truncate font-medium">{o.customer}</span>
                <StatusBadge status={o.status} />
                <span className="num w-16 shrink-0 text-right font-semibold sm:w-20">{money(o.totalCents)}</span>
                <span className="hidden w-14 text-right text-muted sm:block">{shortDate(o.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Order pipeline" action={<Link href="/orders" className="text-sm font-medium text-brand hover:underline">Manage</Link>}>
          <p className="text-sm text-muted"><span className="num font-semibold text-ink">{num(totalOrders)}</span> total orders</p>
          <ul className="mt-3 space-y-3">
            {pipeline.map(({ status, count }) => {
              const share = totalOrders ? Math.round((count / totalOrders) * 100) : 0;
              return (
                <li key={status}>
                  <Link href={`/orders?status=${status}`} className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand">
                    <span className="flex items-center justify-between gap-2">
                      <StatusBadge status={status} />
                      <span className="num text-sm font-medium">{num(count)} <span className="text-xs font-normal text-muted">({share}%)</span></span>
                    </span>
                    <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-canvas">
                      <span
                        className={`block h-full rounded-full transition-[width] ${PIPELINE_COLOR[status]}`}
                        style={{ width: `${share}%` }}
                        role="img"
                        aria-label={`${share}% ${status} orders`}
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
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
