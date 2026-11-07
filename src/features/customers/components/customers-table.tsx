import Link from "next/link";
import { Panel } from "@/components/ui";
import { SearchBox } from "@/components/search-box";
import { longDate, money, num } from "@/lib/format";
import { withParams } from "@/lib/url";
import type { CustomerSort, CustomersQuery } from "../params";
import { listCustomers } from "../queries";

const COLS: { key: CustomerSort; label: string; right?: boolean }[] = [
  { key: "name", label: "Customer" },
  { key: "orders", label: "Orders", right: true },
  { key: "ltv", label: "Lifetime value", right: true },
  { key: "recent", label: "Last order", right: true },
];

export async function CustomersTable({ q }: { q: CustomersQuery }) {
  const { rows, total, pages } = await listCustomers(q);
  const base = { q: q.q, sort: q.sort === "ltv" ? undefined : q.sort, dir: q.dir === "desc" ? undefined : q.dir };
  const sortHref = (col: CustomerSort) =>
    `/customers${withParams(base, { sort: col === "ltv" ? undefined : col, dir: q.sort === col && q.dir === "desc" ? "asc" : undefined, page: undefined })}`;
  const arrow = (col: CustomerSort) => (q.sort === col ? (q.dir === "asc" ? " ↑" : " ↓") : "");
  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchBox defaultValue={q.q} label="Search customers" placeholder="Search name, email or country" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              {COLS.map((c) => (
                <th key={c.key} className={`py-2.5 pr-3 font-medium ${c.right ? "text-right" : ""}`} aria-sort={q.sort === c.key ? (q.dir === "asc" ? "ascending" : "descending") : undefined}>
                  <Link href={sortHref(c.key)} scroll={false} className="hover:text-ink">{c.label}{arrow(c.key)}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-canvas/70">
                <td className="py-3 pr-3">
                  <Link href={`/customers/${c.id}`} className="font-medium hover:text-brand hover:underline">{c.name}</Link>
                  <p className="text-xs text-muted">{c.email} · {c.country}</p>
                </td>
                <td className="num py-3 pr-3 text-right">{num(c.orders)}</td>
                <td className="num py-3 pr-3 text-right font-semibold">{money(c.ltv)}</td>
                <td className="num py-3 pr-3 text-right text-muted">{c.lastOrder ? longDate(c.lastOrder) : "No orders yet"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="py-16 text-center text-sm text-muted">No customers match. Try another name, email or country.</p>}
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <p className="num text-muted">{num(total)} customers · page {q.page} of {pages}</p>
        <div className="flex gap-2">
          <PageLink href={q.page > 1 ? `/customers${withParams(base, { page: q.page - 1 === 1 ? undefined : q.page - 1 })}` : null}>Previous</PageLink>
          <PageLink href={q.page < pages ? `/customers${withParams(base, { page: q.page + 1 })}` : null}>Next</PageLink>
        </div>
      </div>
    </Panel>
  );
}

function PageLink({ href, children }: { href: string | null; children: React.ReactNode }) {
  if (!href) return <span className="rounded-lg border border-line px-3 py-1.5 text-muted/60" aria-disabled="true">{children}</span>;
  return <Link href={href} scroll={false} className="rounded-lg border border-line px-3 py-1.5 font-medium outline-none hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand">{children}</Link>;
}
