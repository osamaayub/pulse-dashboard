import Link from "next/link";
import { Panel } from "@/components/ui";
import { StockEditor } from "@/features/admin/components/editors";
import { adminProducts } from "@/features/admin/queries";
import { LOW_STOCK_THRESHOLD } from "@/features/admin/rules";
import { num } from "@/lib/format";

export const metadata = { title: "Inventory" };

export default async function AdminInventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  const params = await searchParams;
  const lowOnly = params.low === "1";
  const rows = await adminProducts(lowOnly);
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">Inventory</h1><p className="mt-1 text-sm text-muted">Set on-hand quantities. Active products at {LOW_STOCK_THRESHOLD} units or fewer are flagged as low stock.</p></div>
        <nav className="flex gap-2" aria-label="Inventory filter">
          <Link href="/admin/inventory" aria-current={!lowOnly ? "page" : undefined} className={`inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium ${!lowOnly ? "bg-ink text-white" : "border border-line bg-panel hover:bg-canvas"}`}>All</Link>
          <Link href="/admin/inventory?low=1" aria-current={lowOnly ? "page" : undefined} className={`inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium ${lowOnly ? "bg-ink text-white" : "border border-line bg-panel hover:bg-canvas"}`}>Low stock</Link>
        </nav>
      </header>
      <Panel title={`${lowOnly ? "Low-stock products" : "Stock levels"} · ${num(rows.length)}`}>
        {!rows.length ? <p className="py-10 text-center text-sm text-muted">No products match this inventory view.</p> : (
          <ul className="divide-y divide-line">
            {rows.map((product) => (
              <li key={product.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0"><p className="truncate font-medium">{product.name}</p><p className="text-xs text-muted">{product.category} · {product.isActive ? "Active" : "Archived"}</p></div>
                <div className="flex items-center gap-3">
                  {product.isActive && product.stockQuantity <= LOW_STOCK_THRESHOLD && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">Low stock</span>}
                  {!product.isActive && <span className="text-xs text-muted">Archived</span>}
                  <StockEditor id={product.id} quantity={product.stockQuantity} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
