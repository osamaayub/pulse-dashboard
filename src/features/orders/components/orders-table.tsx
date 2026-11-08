import Link from "next/link";
import { SearchBox } from "@/components/search-box";
import { Panel, PillLink } from "@/components/ui";
import { money, num, shortDate } from "@/lib/format";
import { withParams } from "@/lib/url";
import { STATUSES, type OrdersQuery } from "../params";
import { listOrders, statusCounts } from "../queries";
import { ShipButton } from "./ship-button";
import { StatusBadge } from "./status-badge";

export async function OrdersTable({ q }: { q: OrdersQuery }) {
  const [{ rows, total, pages }, counts] = await Promise.all([listOrders(q), statusCounts()]);
  const base = { q: q.q, status: q.status, sort: q.sort === "date" ? undefined : q.sort, dir: q.dir === "desc" ? undefined : q.dir };
  const all = counts.reduce((a, c) => a + c.n, 0);
  const sortLink = (col: "date" | "total") => withParams(base, { sort: col === "date" ? undefined : col, dir: q.sort === col && q.dir === "desc" ? "asc" : undefined, page: undefined });
  const arrow = (col: "date" | "total") => (q.sort === col ? (q.dir === "asc" ? " ↑" : " ↓") : "");
  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchBox defaultValue={q.q} label="Search orders" placeholder="Search name, email or #order" />
        <nav className="flex flex-wrap gap-1" aria-label="Filter by status">
          <PillLink href={`/orders${withParams(base, { status: undefined, page: undefined })}`} active={!q.status}>All <span className="num opacity-60">{num(all)}</span></PillLink>
          {STATUSES.map((s) => (
            <PillLink key={s} href={`/orders${withParams(base, { status: s, page: undefined })}`} active={q.status === s}>
              <span className="capitalize">{s}</span> <span className="num opacity-60">{num(counts.find((c) => c.status === s)?.n ?? 0)}</span>
            </PillLink>
          ))}
        </nav>
        <a href={`/api/orders/export${withParams(base, {})}`} className="ml-auto inline-flex min-h-10 items-center rounded-lg border border-line px-3 text-sm font-medium sm:min-h-0 sm:py-1.5 hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand outline-none">Export CSV</a>
      </div>

      <ul className="divide-y divide-line sm:hidden">
        {rows.map((o) => (
          <li key={o.id} className="py-3">
            <div className="flex items-baseline justify-between gap-3">
              <Link href={`/orders/${o.id}`} className="num font-medium text-brand hover:underline">#{o.id}</Link>
              <span className="num font-semibold">{money(o.totalCents)}</span>
            </div>
            <Link href={`/customers/${o.customerId}`} className="mt-0.5 block truncate text-sm font-medium hover:text-brand">{o.customer}</Link>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted">
              <StatusBadge status={o.status} />
              <span className="num">{shortDate(o.createdAt)}</span>
              <span className="truncate">· {o.country}</span>
              {o.status === "paid" && <span className="ml-auto"><ShipButton id={o.id} /></span>}
            </div>
          </li>
        ))}
      </ul>

      <div className="relative hidden overflow-x-auto sm:block">
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
                <td className="num py-3 pr-3"><Link href={`/orders/${o.id}`} className="font-medium text-brand hover:underline">#{o.id}</Link></td>
                <td className="py-3 pr-3"><Link href={`/customers/${o.customerId}`} className="font-medium hover:text-brand hover:underline">{o.customer}</Link><p className="text-xs text-muted">{o.email} · {o.country}</p></td>
                <td className="num py-3 pr-3 text-muted">{shortDate(o.createdAt)}</td>
                <td className="py-3 pr-3"><StatusBadge status={o.status} /></td>
                <td className="num py-3 pr-3 text-right font-semibold">{money(o.totalCents)}</td>
                <td className="py-3 text-right">{o.status === "paid" && <ShipButton id={o.id} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <p className="py-16 text-center text-sm text-muted">No orders match. Try another name, email or order number.</p>}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
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
  if (!href) return <span className="inline-flex min-h-10 items-center rounded-lg border border-line px-3 text-muted/60 sm:min-h-0 sm:py-1.5" aria-disabled="true">{children}</span>;
  return <Link href={href} scroll={false} className="inline-flex min-h-10 items-center rounded-lg border border-line px-3 font-medium outline-none sm:min-h-0 sm:py-1.5 hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand">{children}</Link>;
}
