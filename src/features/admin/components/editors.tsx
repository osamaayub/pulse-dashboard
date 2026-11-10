"use client";

import { useActionState } from "react";
import { saveCustomer, saveProduct, updateOrderStatus, updateStock } from "../actions";

const fieldClass = "mt-1 min-h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const labelClass = "block text-xs font-medium text-muted";

type ProductRecord = {
  id: number;
  name: string;
  category: string;
  priceCents: number;
  stockQuantity: number;
  isActive: boolean;
};

export function ProductEditor({ product }: { product?: ProductRecord }) {
  const [state, action, pending] = useActionState(saveProduct, null);
  return (
    <form action={action} className="space-y-3 rounded-xl border border-line p-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>Product name<input name="name" required minLength={2} maxLength={100} defaultValue={product?.name} className={fieldClass} /></label>
        <label className={labelClass}>Category<input name="category" required minLength={2} maxLength={40} defaultValue={product?.category} className={fieldClass} /></label>
        <label className={labelClass}>Price (USD)<input name="price" type="number" min="0.01" max="1000000" step="0.01" required defaultValue={product ? (product.priceCents / 100).toFixed(2) : ""} className={fieldClass} /></label>
        <label className={labelClass}>Stock on hand<input name="stockQuantity" type="number" min="0" max="1000000" step="1" required defaultValue={product?.stockQuantity ?? 0} className={fieldClass} /></label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? true} className="size-4 accent-brand" /> Active and available</label>
        <button disabled={pending} className="min-h-10 rounded-lg bg-ink px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">{pending ? "Saving…" : product ? "Save product" : "Add product"}</button>
      </div>
      {state && <p role="status" className={`text-sm ${state.ok ? "text-up" : "text-down"}`}>{state.message}</p>}
    </form>
  );
}

export function StockEditor({ id, quantity }: { id: number; quantity: number }) {
  const [state, action, pending] = useActionState(updateStock, null);
  return (
    <form action={action} className="flex items-center justify-end gap-2">
      <input type="hidden" name="id" value={id} />
      <label className="sr-only" htmlFor={`stock-${id}`}>Stock quantity</label>
      <input id={`stock-${id}`} name="stockQuantity" type="number" min="0" max="1000000" defaultValue={quantity} className="min-h-10 w-24 rounded-lg border border-line px-2 text-right text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
      <button disabled={pending} className="min-h-10 rounded-lg border border-line px-3 text-xs font-medium hover:bg-canvas disabled:opacity-50">{pending ? "Saving…" : "Update"}</button>
      {state && <span role="status" className={`text-xs ${state.ok ? "text-up" : "text-down"}`}>{state.message}</span>}
    </form>
  );
}

export function OrderStatusEditor({ id, status }: { id: number; status: "pending" | "paid" | "shipped" | "refunded" }) {
  const [state, action, pending] = useActionState(updateOrderStatus, null);
  const allowed: Record<typeof status, typeof status[]> = {
    pending: ["pending", "paid"],
    paid: ["paid", "shipped", "refunded"],
    shipped: ["shipped", "refunded"],
    refunded: ["refunded"],
  };
  return (
    <form action={action} className="flex flex-wrap items-center justify-end gap-2">
      <input type="hidden" name="id" value={id} />
      <label className="sr-only" htmlFor={`order-status-${id}`}>Order status</label>
      <select id={`order-status-${id}`} name="status" defaultValue={status} className="min-h-10 rounded-lg border border-line bg-white px-2 text-sm capitalize outline-none focus:border-brand focus:ring-2 focus:ring-brand/20">
        {allowed[status].map((next) => <option key={next} value={next} className="capitalize">{next}</option>)}
      </select>
      <button disabled={pending || status === "refunded"} className="min-h-10 rounded-lg border border-line px-3 text-xs font-medium hover:bg-canvas disabled:opacity-50">{pending ? "Saving…" : "Update"}</button>
      {state && <span role="status" className={`w-full text-right text-xs ${state.ok ? "text-up" : "text-down"}`}>{state.message}</span>}
    </form>
  );
}

type CustomerRecord = { id: number; name: string; email: string; country: string; isActive: boolean };

export function CustomerEditor({ customer }: { customer: CustomerRecord }) {
  const [state, action, pending] = useActionState(saveCustomer, null);
  return (
    <form action={action} className="space-y-4 rounded-xl border border-line p-4">
      <input type="hidden" name="id" value={customer.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>Full name<input name="name" required minLength={2} maxLength={100} defaultValue={customer.name} className={fieldClass} /></label>
        <label className={labelClass}>Email<input name="email" type="email" required maxLength={254} defaultValue={customer.email} className={fieldClass} /></label>
        <label className={labelClass}>Country<input name="country" required minLength={2} maxLength={80} defaultValue={customer.country} className={fieldClass} /></label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={customer.isActive} className="size-4 accent-brand" /> Active customer</label>
        <button disabled={pending} className="min-h-10 rounded-lg bg-ink px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">{pending ? "Saving…" : "Save customer"}</button>
      </div>
      {state && <p role="status" className={`text-sm ${state.ok ? "text-up" : "text-down"}`}>{state.message}</p>}
    </form>
  );
}
