import { listOrders } from "@/server/queries";
import { ordersQuerySchema } from "@/lib/params";

const cell = (v: string | number) => {
  const s = String(v);
  // Quote every cell and neutralise formulas, so the file is safe to open in Excel or Sheets.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

/** Downloads the current filtered view (up to 50 pages) as CSV. */
export async function GET(req: Request) {
  const q = ordersQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const lines = [["Order", "Date", "Customer", "Email", "Country", "Status", "Total (USD)"].map(cell).join(",")];
  for (let page = 1; page <= 50; page++) {
    const { rows, pages } = await listOrders({ ...q, page });
    for (const r of rows) lines.push([r.id, r.createdAt.toISOString().slice(0, 10), r.customer, r.email, r.country, r.status, (r.totalCents / 100).toFixed(2)].map(cell).join(","));
    if (page >= pages) break;
  }
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="orders.csv"', "Cache-Control": "no-store" },
  });
}
