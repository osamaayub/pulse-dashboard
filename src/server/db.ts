import "server-only";
import { sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { DDL } from "./ddl";
import { databaseUrl } from "./env";
import * as schema from "./schema";
import { buildSeed } from "./seed";

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Creates the tables if they're missing and adds demo data if the store is empty. Safe to run on every cold start. */
async function prepare(db: DB) {
  await db.transaction(async (tx) => {
    // One server at a time: parallel cold starts wait here instead of seeding twice.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(724001)`);
    await tx.execute(sql.raw(DDL));
    const res = (await tx.execute(sql`SELECT count(*)::int AS n FROM orders`)) as unknown as { rows: { n: number }[] };
    if (res.rows[0].n > 0) return;
    const seed = buildSeed();
    await tx.insert(schema.customers).values(seed.customers);
    await tx.insert(schema.products).values(seed.products);
    for (let i = 0; i < seed.orders.length; i += 500) await tx.insert(schema.orders).values(seed.orders.slice(i, i + 500));
    for (let i = 0; i < seed.items.length; i += 500) await tx.insert(schema.orderItems).values(seed.items.slice(i, i + 500));
    for (const t of ["customers", "products", "orders", "order_items"]) await tx.execute(sql.raw(`SELECT setval(pg_get_serial_sequence('${t}','id'), (SELECT max(id) FROM ${t}))`));
  });
  return db;
}

/** Real PostgreSQL: DATABASE_URL (local, Neon, Supabase, RDS...) or Netlify Database (NETLIFY_DB_URL). */
async function connectPostgres(url: string): Promise<DB> {
  const { Pool } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const local = /localhost|127\.0\.0\.1/.test(url);
  const pool = new Pool({ connectionString: url, max: 5, ssl: local ? undefined : { rejectUnauthorized: true } });
  return prepare(drizzle(pool, { schema }) as unknown as DB);
}

/** No DATABASE_URL: Postgres compiled to WebAssembly (PGlite), in memory, so the demo runs with zero setup. */
async function demoDatabase(): Promise<DB> {
  const [{ PGlite }, { drizzle }] = await Promise.all([import("@electric-sql/pglite"), import("drizzle-orm/pglite")]);
  return prepare(drizzle(new PGlite(), { schema }) as unknown as DB);
}

const g = globalThis as unknown as { __pulseDb?: Promise<DB> };
/** One connection pool (or demo database) per server instance, shared by every request. */
export function getDb() {
  g.__pulseDb ??= (databaseUrl ? connectPostgres(databaseUrl) : demoDatabase()).catch((e) => {
    g.__pulseDb = undefined; // let the next request retry instead of caching the failure
    throw e;
  });
  return g.__pulseDb;
}
