import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Panel, PillLink, StatusBadge } from "@/components/ui";
import { SearchBox } from "@/components/search-box";
import { ShipButton } from "@/components/ship-button";
import { money, num, shortDate } from "@/lib/format";
import { ordersQuerySchema, STATUSES, withParams, type OrdersQuery } from "@/lib/params";
import { listOrders, statusCounts } from "@/server/queries";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage({ searchParams }: PageProps<"/orders">) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-muted">Search, filter and ship orders. Everything runs as SQL on the server.</p>
        </div>
      </header>
      <Suspense fallback={<div className="skeleton h-[40rem]" />}>
        {searchParams.then((sp) => <Orders q={ordersQuerySchema.parse(sp)} />)}
      </Suspense>
    </div>
  );
}

async function Orders({ q }: { q: OrdersQuery }) {
  const [{ rows, total, pages }, counts] = await Promise.all([listOrders(q), statusCounts()]);
  const base = { q: q.q, status: q.status, sort: q.sort === "date" ? undefined : q.sort, dir: q.dir === "desc" ? undefined : q.dir };
  const all = counts.reduce((a, c) => a + c.n, 0);
  const sortLink = (col: "date" | "total") => withParams(base, { sort: col === "date" ? undefined : col, dir: q.sort === col && q.dir === "desc" ? "asc" : undefined, page: undefined });
  const arrow = (col: "date" | "total") => (q.sort === col ? (q.dir === "asc" ? " ↑" : " ↓") : "");
  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchBox defaultValue={q.q} />
        <nav className="flex flex-wrap gap-1" aria-label="Filter by status">
          <PillLink href={`/orders${withParams(base, { status: undefined, page: undefined })}`} active={!q.status}>All <span className="num opacity-60">{num(all)}</span></PillLink>
          {STATUSES.map((s) => (
            <PillLink key={s} href={`/orders${withParams(base, { status: s, page: undefined })}`} active={q.status === s}>
              <span className="capitalize">{s}</span> <span className="num opacity-60">{num(counts.find((c) => c.status === s)?.n ?? 0)}</span>
            </PillLink>
          ))}
        </nav>
        <a href={`/api/orders.csv${withParams(base, {})}`} className="ml-auto rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand outline-none">Export CSV</a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              <th className="py-2.5 pr-3 font-medium">Order</th>
              <th className="py-2.5 pr-3 font-medium">Customer</th>
              <th className="py-2.5 pr-3 font-medium"><Link href={`/orders${sortLink("date")}`} scroll={false} className="hover:text-ink">Date{arrow("date")}</Link></th>
              <th className="py-2.5 pr-3 font-medium">Status</th>
              <th className="py-2.5 pr-3 text-right font-medium"><Link href={`/orders${sortLink("total")}`} scroll={false} className="hover:text-ink">Total{arrow("total")}</Link></th>
              <th className="py-2.5 text-right font-medium"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-canvas/70">
                <td className="num py-3 pr-3 text-muted">#{o.id}</td>
                <td className="py-3 pr-3"><p className="font-medium">{o.customer}</p><p className="text-xs text-muted">{o.email} · {o.country}</p></td>
                <td className="num py-3 pr-3 text-muted">{shortDate(o.createdAt)}</td>
                <td className="py-3 pr-3"><StatusBadge status={o.status} /></td>
                <td className="num py-3 pr-3 text-right font-semibold">{money(o.totalCents)}</td>
                <td className="py-3 text-right">{o.status === "paid" && <ShipButton id={o.id} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="py-16 text-center text-sm text-muted">No orders match. Try another name, email or order number.</p>}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <p className="num text-muted">{num(total)} orders · page {q.page} of {pages}</p>
        <div className="flex gap-2">
          <PageLink href={q.page > 1 ? `/orders${withParams(base, { page: q.page - 1 === 1 ? undefined : q.page - 1 })}` : null}>Previous</PageLink>
          <PageLink href={q.page < pages ? `/orders${withParams(base, { page: q.page + 1 })}` : null}>Next</PageLink>
        </div>
      </div>
    </Panel>
  );
}

function PageLink({ href, children }: { href: string | null; children: React.ReactNode }) {
  if (!href) return <span className="rounded-lg border border-line px-3 py-1.5 text-muted/60" aria-disabled="true">{children}</span>;
  return <Link href={href} scroll={false} className="rounded-lg border border-line px-3 py-1.5 font-medium outline-none hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand">{children}</Link>;
}
