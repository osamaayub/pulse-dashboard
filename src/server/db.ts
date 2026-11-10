import "server-only";
import { sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { connection } from "next/server";
import { DDL } from "./ddl";
import { insertSample, resetSample, stampIfMissing } from "./demo";
import { resetDue } from "./demo-rules";
import { database, demoResetHours } from "./env";
import * as schema from "./schema";

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Creates the tables if they're missing and adds sample data if the store is empty. Safe to run on every cold start. */
async function prepare(db: DB) {
  await db.transaction(async (tx) => {
    // One server at a time: parallel cold starts wait here instead of seeding twice.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(724001)`);
    // One statement per call: PGlite (and some poolers) reject several statements in one query.
    for (const stmt of DDL.split("\n").map((l) => l.trim()).filter(Boolean)) await tx.execute(sql.raw(stmt));
    const res = (await tx.execute(sql`SELECT count(*)::int AS n FROM orders`)) as unknown as { rows: { n: number }[] };
    if (res.rows[0].n === 0) await insertSample(tx);
  });
  await stampIfMissing(db);
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

const g = globalThis as unknown as { __pulseDb?: Promise<DB>; __pulseResetCheck?: number };
const CHECK_EVERY_MS = 5 * 60_000;

/** One connection pool (or demo database) per server instance, shared by every request. */
export async function getDb() {
  await connection();
  g.__pulseDb ??= (database.url ? connectPostgres(database.url) : demoDatabase()).catch((e) => {
    g.__pulseDb = undefined; // let the next request retry instead of caching the failure
    throw e;
  });
  const db = await g.__pulseDb;
  // At most every 5 minutes per server: replace the sample data if it is older than DEMO_RESET_HOURS.
  if (demoResetHours && Date.now() - (g.__pulseResetCheck ?? 0) > CHECK_EVERY_MS) {
    g.__pulseResetCheck = Date.now();
    await resetSample(db, (seeded) => resetDue(seeded, new Date(), demoResetHours)).catch(() => "busy");
  }
  return db;
}
