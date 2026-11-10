import { Panel } from "@/components/ui";
import { ProductEditor } from "@/features/admin/components/editors";
import { adminProducts } from "@/features/admin/queries";
import { money, num } from "@/lib/format";

export const metadata = { title: "Manage products" };

export default async function AdminProductsPage() {
  const rows = await adminProducts();
  return (
    <>
      <header><h1 className="text-2xl font-semibold tracking-tight">Product management</h1><p className="mt-1 text-sm text-muted">Create, edit and archive products. Archived items stay in order history.</p></header>
      <Panel title="Add a product"><ProductEditor /></Panel>
      <Panel title={`Catalog · ${num(rows.length)} products`}>
        <ul className="divide-y divide-line">
          {rows.map((product) => (
            <li key={product.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{product.name}</p>
                  <p className="text-xs text-muted">{product.category} · {money(product.priceCents)} · {num(product.stockQuantity)} in stock · {product.isActive ? "Active" : "Archived"}</p>
                </div>
                <details className="min-w-0">
                  <summary className="min-h-10 cursor-pointer rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-canvas">Edit</summary>
                  <div className="mt-3 sm:min-w-[34rem]"><ProductEditor product={product} /></div>
                </details>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
