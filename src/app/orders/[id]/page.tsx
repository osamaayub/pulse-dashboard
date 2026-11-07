import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { OrderDetail } from "@/features/orders/components/order-detail";

export const metadata: Metadata = { title: "Order" };

const idSchema = z.coerce.number().int().positive().max(2_147_483_647);

export default function OrderPage({ params }: PageProps<"/orders/[id]">) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Suspense fallback={<div className="skeleton h-[30rem]" />}>
        {params.then(({ id }) => {
          const parsed = idSchema.safeParse(id);
          if (!parsed.success) notFound();
          return <OrderDetail id={parsed.data} />;
        })}
      </Suspense>
    </div>
  );
}
