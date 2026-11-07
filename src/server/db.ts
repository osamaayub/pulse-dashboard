import "server-only";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";
import { buildSeed } from "./seed";

const DDL = `
CREATE TYPE order_status AS ENUM ('pending','paid','shipped','refunded');
CREATE TABLE customers (id serial PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE, country text NOT NULL, created_at timestamptz NOT NULL);
CREATE TABLE products (id serial PRIMARY KEY, name text NOT NULL, category text NOT NULL, price_cents integer NOT NULL);
CREATE TABLE orders (id serial PRIMARY KEY, customer_id integer NOT NULL REFERENCES customers(id), status order_status NOT NULL, total_cents integer NOT NULL, created_at timestamptz NOT NULL);
CREATE INDEX orders_created_idx ON orders(created_at);
CREATE INDEX orders_status_idx ON orders(status);
CREATE TABLE order_items (id serial PRIMARY KEY, order_id integer NOT NULL REFERENCES orders(id), product_id integer NOT NULL REFERENCES products(id), quantity integer NOT NULL, unit_cents integer NOT NULL);
`;

async function create() {
  // Postgres compiled to WebAssembly, running inside the server process: no setup, no keys.
  // Swap for a hosted Postgres (Neon, Supabase) by changing this file only; the queries stay the same.
  const client = new PGlite();
  await client.exec(DDL);
  const db = drizzle(client, { schema });
  const seed = buildSeed();
  await db.insert(schema.customers).values(seed.customers);
  await db.insert(schema.products).values(seed.products);
  for (let i = 0; i < seed.orders.length; i += 500) await db.insert(schema.orders).values(seed.orders.slice(i, i + 500));
  for (let i = 0; i < seed.items.length; i += 500) await db.insert(schema.orderItems).values(seed.items.slice(i, i + 500));
  for (const t of ["customers", "products", "orders", "order_items"]) await client.exec(`SELECT setval(pg_get_serial_sequence('${t}','id'), (SELECT max(id) FROM ${t}))`);
  return db;
}

const g = globalThis as unknown as { __pulseDb?: ReturnType<typeof create> };
/** One database per server instance, created on first use and shared by every request. */
export function getDb() {
  g.__pulseDb ??= create();
  return g.__pulseDb;
}
