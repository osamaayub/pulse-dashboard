import Link from "next/link";
import { Delta, Panel, PillLink } from "@/components/ui";
import { RANGES, type Range } from "@/features/analytics/range";
import { money, num } from "@/lib/format";
import { withParams } from "@/lib/url";
import type { ProductSort, ProductsQuery } from "../params";
import { productPerformance } from "../queries";

const LABEL: Record<Range, string> = { "7d": "7 days", "30d": "30 days", "90d": "90 days", "12m": "12 months" };
const COLS: { key: ProductSort; label: string; right?: boolean }[] = [
  { key: "name", label: "Product" },
  { key: "units", label: "Units sold", right: true },
  { key: "revenue", label: "Revenue", right: true },
  { key: "growth", label: "vs previous", right: true },
];

export async function ProductsTable({ q }: { q: ProductsQuery }) {
  const { rows, categories } = await productPerformance(q);
  const base = { range: q.range === "30d" ? undefined : q.range, category: q.category, sort: q.sort === "revenue" ? undefined : q.sort };
  const href = (patch: Record<string, string | undefined>) => `/products${withParams(base, patch)}`;
  const top = Math.max(1, ...rows.map((r) => r.revenue));
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted">What sold in the last {LABEL[q.range]}, compared with the {LABEL[q.range]} before. Refunds are left out.</p>
        </div>
        <nav className="flex gap-1 rounded-xl bg-[#e8ecf3] p-1" aria-label="Date range">
          {(Object.keys(RANGES) as Range[]).map((r) => (
            <PillLink key={r} href={href({ range: r === "30d" ? undefined : r })} active={r === q.range}>{r}</PillLink>
          ))}
        </nav>
      </header>
      <Panel>
        <nav className="mb-4 flex flex-wrap gap-1" aria-label="Filter by category">
          <PillLink href={href({ category: undefined })} active={!q.category}>All</PillLink>
          {categories.map((c) => <PillLink key={c} href={href({ category: c })} active={q.category === c}>{c}</PillLink>)}
        </nav>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                {COLS.map((c) => (
                  <th key={c.key} className={`py-2.5 pr-3 font-medium ${c.right ? "text-right" : ""}`} aria-sort={q.sort === c.key ? (c.key === "name" ? "ascending" : "descending") : undefined}>
                    <Link href={href({ sort: c.key === "revenue" ? undefined : c.key })} scroll={false} className="hover:text-ink">{c.label}{q.sort === c.key ? (c.key === "name" ? " ↑" : " ↓") : ""}</Link>
                  </th>
                ))}
                <th className="w-40 py-2.5 font-medium">Share of revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-canvas/70">
                  <td className="py-3 pr-3"><p className="font-medium">{p.name}</p><p className="text-xs text-muted">{p.category} · {money(p.priceCents)}</p></td>
                  <td className="num py-3 pr-3 text-right">{num(p.units)}</td>
                  <td className="num py-3 pr-3 text-right font-semibold">{money(p.revenue)}</td>
                  <td className="py-3 pr-3 text-right">{p.revenue || p.growth ? <Delta value={p.growth} /> : <span className="text-xs text-muted">No sales</span>}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-canvas"><div className="h-full rounded-full bg-brand" style={{ width: `${(p.revenue / top) * 100}%` }} /></div>
                      <span className="num w-12 text-right text-xs text-muted">{(p.share * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="py-16 text-center text-sm text-muted">No products in this category.</p>}
        </div>
      </Panel>
    </>
  );
}
