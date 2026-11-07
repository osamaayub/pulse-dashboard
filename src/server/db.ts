import "server-only";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Real PostgreSQL when DATABASE_URL is set (local, Neon, Supabase, RDS...). Run `npm run db:setup` once to create and seed it. */
async function connectPostgres(url: string): Promise<DB> {
  const { Pool } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const local = /localhost|127\.0\.0\.1/.test(url);
  const pool = new Pool({ connectionString: url, max: 5, ssl: local ? undefined : { rejectUnauthorized: true } });
  return drizzle(pool, { schema }) as unknown as DB;
}

/** No DATABASE_URL: Postgres compiled to WebAssembly (PGlite), in memory and seeded, so the demo runs with zero setup. */
async function demoDatabase(): Promise<DB> {
  const [{ PGlite }, { drizzle }, { DDL }, { buildSeed }] = await Promise.all([
    import("@electric-sql/pglite"), import("drizzle-orm/pglite"), import("./ddl"), import("./seed"),
  ]);
  const client = new PGlite();
  await client.exec(DDL);
  const db = drizzle(client, { schema });
  const seed = buildSeed();
  await db.insert(schema.customers).values(seed.customers);
  await db.insert(schema.products).values(seed.products);
  for (let i = 0; i < seed.orders.length; i += 500) await db.insert(schema.orders).values(seed.orders.slice(i, i + 500));
  for (let i = 0; i < seed.items.length; i += 500) await db.insert(schema.orderItems).values(seed.items.slice(i, i + 500));
  for (const t of ["customers", "products", "orders", "order_items"]) await client.exec(`SELECT setval(pg_get_serial_sequence('${t}','id'), (SELECT max(id) FROM ${t}))`);
  return db as unknown as DB;
}

const g = globalThis as unknown as { __pulseDb?: Promise<DB> };
/** One connection pool (or demo database) per server instance, shared by every request. */
export function getDb() {
  const url = process.env.DATABASE_URL;
  g.__pulseDb ??= url ? connectPostgres(url) : demoDatabase();
  return g.__pulseDb;
}

export const usingRealPostgres = () => Boolean(process.env.DATABASE_URL);
