import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel } from "@/components/ui";
import { longDate, money, num } from "@/lib/format";
import { getOrder } from "../queries";
import { RefundButton } from "./refund-button";
import { ShipButton } from "./ship-button";
import { StatusBadge } from "./status-badge";

const STEPS = ["pending", "paid", "shipped"] as const;

export async function OrderDetail({ id }: { id: number }) {
  const order = await getOrder(id);
  if (!order) notFound();
  const units = order.items.reduce((a, i) => a + i.quantity, 0);
  const reached = order.status === "refunded" ? -1 : STEPS.indexOf(order.status);
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/orders" className="text-sm text-muted hover:text-ink">← Orders</Link>
          <h1 className="mt-1 flex items-center gap-3 text-2xl font-semibold tracking-tight">
            Order <span className="num">#{order.id}</span> <StatusBadge status={order.status} />
          </h1>
          <p className="mt-1 text-sm text-muted">Placed {longDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {order.status === "paid" && <ShipButton id={order.id} />}
          {(order.status === "paid" || order.status === "shipped") && <RefundButton id={order.id} />}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel title={`Items · ${num(units)} ${units === 1 ? "unit" : "units"}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  <th className="py-2.5 pr-3 font-medium">Product</th>
                  <th className="py-2.5 pr-3 text-right font-medium">Price</th>
                  <th className="py-2.5 pr-3 text-right font-medium">Qty</th>
                  <th className="py-2.5 text-right font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-3 pr-3"><p className="font-medium">{i.product}</p><p className="text-xs text-muted">{i.category}</p></td>
                    <td className="num py-3 pr-3 text-right">{money(i.unitCents)}</td>
                    <td className="num py-3 pr-3 text-right">{i.quantity}</td>
                    <td className="num py-3 text-right font-medium">{money(i.unitCents * i.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line">
                  <td colSpan={3} className="pt-3 text-right font-medium">Total</td>
                  <td className="num pt-3 text-right text-base font-semibold">{money(order.totalCents)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Customer">
            <Link href={`/customers/${order.customerId}`} className="font-medium text-brand hover:underline">{order.customer}</Link>
            <p className="mt-1 text-sm text-muted">{order.email}</p>
            <p className="text-sm text-muted">{order.country}</p>
            <p className="mt-3 text-xs text-muted">Customer since {longDate(order.customerSince)}</p>
          </Panel>
          <Panel title="Progress">
            {order.status === "refunded" ? (
              <p className="text-sm text-muted">This order was refunded, so it no longer counts as revenue.</p>
            ) : (
              <ol className="space-y-3">
                {STEPS.map((s, i) => (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    <span className={`grid size-6 place-items-center rounded-full text-xs font-semibold ${i <= reached ? "bg-brand text-white" : "bg-canvas text-muted ring-1 ring-line"}`}>{i <= reached ? "✓" : i + 1}</span>
                    <span className={`capitalize ${i <= reached ? "font-medium" : "text-muted"}`}>{s}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
