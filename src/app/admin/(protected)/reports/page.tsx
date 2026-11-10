import Link from "next/link";
import { connection } from "next/server";
import { Delta, Panel } from "@/components/ui";
import { CategoryChart, RevenueChart } from "@/features/analytics/components/charts";
import { getKpis, getRevenueSeries, getSalesByCategory } from "@/features/analytics/queries";
import { delta } from "@/features/analytics/range";
import { statusCounts } from "@/features/orders/queries";
import { money, num } from "@/lib/format";

export const metadata = { title: "Admin reports" };
export const instant = false;

export default async function AdminReportsPage() {
  await connection();
  const [{ cur, prev }, series, categories, statuses] = await Promise.all([
    getKpis("12m"),
    getRevenueSeries("12m"),
    getSalesByCategory("12m"),
    statusCounts(),
  ]);
  const metrics = [
    { label: "Revenue · 12 months", value: money(cur.revenue), change: delta(cur.revenue, prev.revenue) },
    { label: "Orders · 12 months", value: num(cur.orders), change: delta(cur.orders, prev.orders) },
    { label: "Average order", value: money(cur.aov), change: delta(cur.aov, prev.aov) },
    { label: "New customers", value: num(cur.newCustomers), change: delta(cur.newCustomers, prev.newCustomers) },
  ];
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">Reports</h1><p className="mt-1 text-sm text-muted">A twelve-month view compared with the previous twelve months.</p></div>
        <a href="/api/admin/reports" className="inline-flex min-h-10 items-center rounded-lg border border-line bg-panel px-3 text-sm font-medium hover:bg-canvas">Download CSV</a>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {metrics.map((metric) => <div key={metric.label} className="rounded-2xl border border-line bg-panel p-4"><p className="text-xs text-muted sm:text-sm">{metric.label}</p><p className="num mt-2 text-xl font-semibold sm:text-2xl">{metric.value}</p><div className="mt-1"><Delta value={metric.change} /></div></div>)}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel title="Monthly sales"><RevenueChart data={series} /></Panel>
        <Panel title="Revenue by category"><CategoryChart data={categories} /></Panel>
      </div>
      <Panel title="Order status totals">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statuses.map(({ status, n }) => <li key={status} className="rounded-xl bg-canvas p-3"><p className="text-sm capitalize text-muted">{status}</p><p className="num mt-1 text-xl font-semibold">{num(n)}</p></li>)}
        </ul>
        <Link href="/admin/orders" className="mt-4 inline-flex min-h-10 items-center text-sm font-medium text-brand hover:underline">Manage orders →</Link>
      </Panel>
    </>
  );
}
