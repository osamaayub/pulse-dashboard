import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsTable } from "@/features/products/components/products-table";
import { productsQuerySchema } from "@/features/products/params";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Suspense fallback={<div className="skeleton h-[40rem]" />}>
        {searchParams.then((sp) => <ProductsTable q={productsQuerySchema.parse(sp)} />)}
      </Suspense>
    </div>
  );
}
