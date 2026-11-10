import { csvRow } from "@/features/orders/csv";
import { getRevenueSeries } from "@/features/analytics/queries";
import { requireAdmin } from "@/server/admin-auth";

export async function GET() {
  await requireAdmin();
  const rows = await getRevenueSeries("12m");
  const lines = [csvRow(["Month", "Revenue (USD)", "Orders"])];
  for (const row of rows) lines.push(csvRow([row.label, row.revenue.toFixed(2), row.orders]));
  const day = new Date().toISOString().slice(0, 10);
  return new Response(`${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pulse-report-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
