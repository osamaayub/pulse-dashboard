import type { Metadata } from "next";
import { Suspense } from "react";
import { OrdersTable } from "@/features/orders/components/orders-table";
import { ordersQuerySchema } from "@/features/orders/params";


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
        {searchParams.then((sp) => <OrdersTable q={ordersQuerySchema.parse(sp)} />)}
      </Suspense>
    </div>
  );
}
