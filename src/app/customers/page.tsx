import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerSummary } from "@/features/customers/components/customer-summary";
import { CustomersTable } from "@/features/customers/components/customers-table";
import { customersQuerySchema } from "@/features/customers/params";

export const metadata: Metadata = { title: "Customers" };

export default function CustomersPage({ searchParams }: PageProps<"/customers">) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="mt-1 text-sm text-muted">Who buys, how often, and how much they have spent in total.</p>
      </header>
      <Suspense fallback={<div className="skeleton h-28" />}>
        <CustomerSummary />
      </Suspense>
      <Suspense fallback={<div className="skeleton h-[40rem]" />}>
        {searchParams.then((sp) => <CustomersTable q={customersQuerySchema.parse(sp)} />)}
      </Suspense>
    </div>
  );
}
