import Link from "next/link";
import { Panel } from "@/components/ui";
import { CustomerEditor } from "@/features/admin/components/editors";
import { adminCustomer, adminCustomers } from "@/features/admin/queries";
import { num } from "@/lib/format";

export const metadata = { title: "Manage customers" };

export default async function AdminCustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().slice(0, 60);
  const selectedId = Number(Array.isArray(params.id) ? params.id[0] : params.id);
  const [rows, selected] = await Promise.all([
    adminCustomers(query),
    Number.isInteger(selectedId) && selectedId > 0 ? adminCustomer(selectedId) : Promise.resolve(null),
  ]);
  const q = query ? `?q=${encodeURIComponent(query)}` : "";
  return (
    <>
      <header><h1 className="text-2xl font-semibold tracking-tight">Customer management</h1><p className="mt-1 text-sm text-muted">Update customer contact records or deactivate accounts without deleting order history.</p></header>
      <Panel>
        <form action="/admin/customers" className="mb-4 flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="customer-search">Search customers</label>
          <input id="customer-search" name="q" defaultValue={query} placeholder="Search name or email" className="min-h-10 min-w-0 flex-1 rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
          <button className="min-h-10 rounded-lg bg-ink px-4 text-sm font-medium text-white">Search</button>
        </form>
        <p className="mb-2 text-xs text-muted">Showing up to 50 matches ({num(rows.length)}).</p>
        <ul className="divide-y divide-line">
          {rows.map((customer) => (
            <li key={customer.id} className="py-2.5">
              <Link href={`/admin/customers${q}${q ? "&" : "?"}id=${customer.id}`} className="flex min-h-10 items-center justify-between gap-3 rounded-lg px-2 hover:bg-canvas">
                <span className="min-w-0"><span className="block truncate text-sm font-medium">{customer.name}</span><span className="block truncate text-xs text-muted">{customer.email} · {customer.country}</span></span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${customer.isActive ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{customer.isActive ? "Active" : "Inactive"}</span>
              </Link>
            </li>
          ))}
        </ul>
        {!rows.length && <p className="py-8 text-center text-sm text-muted">No customers match that search.</p>}
      </Panel>
      {selected && <Panel title={`Edit customer · #${selected.id}`}><CustomerEditor customer={selected} /></Panel>}
    </>
  );
}
