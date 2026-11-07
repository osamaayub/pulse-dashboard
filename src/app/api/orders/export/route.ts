import { csvRow } from "@/features/orders/csv";
import { ordersQuerySchema } from "@/features/orders/params";
import { exportOrders } from "@/features/orders/queries";

/** Downloads the current filtered view as CSV: one SQL query, every matching row (up to 10,000). */
export async function GET(req: Request) {
  const q = ordersQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  try {
    const rows = await exportOrders(q);
    const lines = [csvRow(["Order", "Date", "Customer", "Email", "Country", "Status", "Total (USD)"])];
    for (const r of rows) lines.push(csvRow([r.id, new Date(r.createdAt).toISOString().slice(0, 10), r.customer, r.email, r.country, r.status, (r.totalCents / 100).toFixed(2)]));
    const day = new Date().toISOString().slice(0, 10);
    return new Response(lines.join("\r\n") + "\r\n", {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="orders-${day}.csv"`, "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Export failed. Open /api/health to check the database." }, { status: 500 });
  }
}
