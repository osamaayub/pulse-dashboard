import { sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { seededAt } from "@/server/demo";
import { database, demoResetHours } from "@/server/env";

/** Open /api/health to see which database the app uses and whether it works. Never shows passwords. */
export async function GET() {
  const hide = (s: string) => s.replace(/\/\/[^@/\s]+@/g, "//***@");
  const started = Date.now();
  try {
    const db = await getDb();
    const res = (await db.execute(sql`SELECT count(*)::int AS orders, version() AS version FROM orders`)) as unknown as { rows: { orders: number; version: string }[] };
    const { orders, version } = res.rows[0];
    const sample = { madeAt: await seededAt(db), resetsEveryHours: demoResetHours };
    return Response.json({ ok: true, database: database.source, orders, postgres: version.split(" on ")[0], sample, ms: Date.now() - started, warnings: database.problems }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const err = e as { name?: string; code?: string; message?: string };
    return Response.json(
      { ok: false, database: database.source, error: { name: err.name, code: err.code, message: hide(String(err.message ?? e)).slice(0, 300) }, warnings: database.problems },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
