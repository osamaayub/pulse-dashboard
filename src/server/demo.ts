import "server-only";
import { sql } from "drizzle-orm";
import type { DB } from "./db";
import { SAMPLE_EMAIL_DOMAIN } from "./demo-rules";
import * as schema from "./schema";
import { buildSeed } from "./seed";

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
const rows = <T>(r: unknown) => (r as { rows: T[] }).rows;

/** Fills an empty store with the sample data and records when that happened. */
export async function insertSample(tx: Tx) {
  const seed = buildSeed();
  await tx.insert(schema.customers).values(seed.customers);
  await tx.insert(schema.products).values(seed.products);
  for (let i = 0; i < seed.orders.length; i += 500) await tx.insert(schema.orders).values(seed.orders.slice(i, i + 500));
  for (let i = 0; i < seed.items.length; i += 500) await tx.insert(schema.orderItems).values(seed.items.slice(i, i + 500));
  for (const t of ["customers", "products", "orders", "order_items"]) await tx.execute(sql.raw(`SELECT setval(pg_get_serial_sequence('${t}','id'), (SELECT max(id) FROM ${t}))`));
  await tx.execute(sql`INSERT INTO demo_meta (id, seeded_at) VALUES (1, now()) ON CONFLICT (id) DO UPDATE SET seeded_at = excluded.seeded_at`);
}

/** When the sample data was last made, or null if unknown. */
export async function seededAt(db: DB | Tx) {
  const r = rows<{ seeded_at: string | Date }>(await db.execute(sql`SELECT seeded_at FROM demo_meta WHERE id = 1`));
  return r[0] ? new Date(r[0].seeded_at) : null;
}

/** Only the app's own sample store may be replaced: every customer must use the sample email domain. */
async function isSampleData(tx: Tx) {
  const pattern = `%${SAMPLE_EMAIL_DOMAIN}`;
  const r = rows<{ ok: boolean }>(await tx.execute(sql`SELECT count(*) > 0 AND count(*) FILTER (WHERE email NOT LIKE ${pattern}) = 0 AS ok FROM customers`));
  return r[0]?.ok === true;
}

export type ResetOutcome = "reset" | "busy" | "not-sample" | "not-due";

/**
 * Replaces the sample store with a fresh copy (dates move up to today, every status goes back to normal).
 * `shouldReset` runs inside the lock with the current seeded_at, so two servers never reset twice.
 */
export async function resetSample(db: DB, shouldReset: (seeded: Date | null) => boolean): Promise<ResetOutcome> {
  return db.transaction(async (tx) => {
    const lock = rows<{ ok: boolean }>(await tx.execute(sql`SELECT pg_try_advisory_xact_lock(724002) AS ok`));
    if (!lock[0]?.ok) return "busy";
    const seeded = await seededAt(tx);
    if (!shouldReset(seeded)) return "not-due";
    if (!(await isSampleData(tx))) return "not-sample";
    await tx.execute(sql`TRUNCATE order_items, orders, customers, products RESTART IDENTITY`);
    await insertSample(tx);
    return "reset";
  });
}

/** Older stores (made before demo_meta existed) get a timestamp now, so the 24-hour clock starts. */
export async function stampIfMissing(db: DB) {
  await db.execute(sql`INSERT INTO demo_meta (id, seeded_at) SELECT 1, now() WHERE EXISTS (SELECT 1 FROM orders) ON CONFLICT (id) DO NOTHING`);
}
