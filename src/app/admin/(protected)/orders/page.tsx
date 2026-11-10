import Link from "next/link";
import { Panel } from "@/components/ui";
import { OrderStatusEditor } from "@/features/admin/components/editors";
import { adminOrders } from "@/features/admin/queries";
import { money, shortDate } from "@/lib/format";
import { StatusBadge } from "@/features/orders/components/status-badge";

export const metadata = { title: "Manage orders" };

export default async function AdminOrdersPage() {
  const rows = await adminOrders();
  return (
    <>
      <header><h1 className="text-2xl font-semibold tracking-tight">Order management</h1><p className="mt-1 text-sm text-muted">Update recent order statuses using valid fulfillment transitions. Showing the latest {rows.length} orders.</p></header>
      <Panel>
        <ul className="divide-y divide-line">
          {rows.map((order) => (
            <li key={order.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <Link href={`/orders/${order.id}`} className="font-medium text-brand hover:underline">Order #{order.id}</Link>
                <p className="truncate text-xs text-muted">{order.customer} · {shortDate(order.createdAt)} · {money(order.totalCents)}</p>
              </div>
              <StatusBadge status={order.status} />
              <OrderStatusEditor id={order.id} status={order.status} />
            </li>
          ))}
        </ul>
        {!rows.length && <p className="py-12 text-center text-sm text-muted">No orders found.</p>}
      </Panel>
    </>
  );
}
