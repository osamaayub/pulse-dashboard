import { csvRow } from "@/features/orders/csv";
import { ordersQuerySchema } from "@/features/orders/params";
import { listOrders } from "@/features/orders/queries";

/** Downloads the current filtered view (up to 50 pages) as CSV. */
export async function GET(req: Request) {
  const q = ordersQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const lines = [csvRow(["Order", "Date", "Customer", "Email", "Country", "Status", "Total (USD)"])];
  for (let page = 1; page <= 50; page++) {
    const { rows, pages } = await listOrders({ ...q, page });
    for (const r of rows) lines.push(csvRow([r.id, r.createdAt.toISOString().slice(0, 10), r.customer, r.email, r.country, r.status, (r.totalCents / 100).toFixed(2)]));
    if (page >= pages) break;
  }
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="orders.csv"', "Cache-Control": "no-store" },
  });
}
