// Creates the tables in your PostgreSQL database and fills them with two years of demo orders.
// Usage: npm run db:setup            (keeps existing tables, adds data only if empty)
//        npm run db:setup -- --reset (drops and recreates everything)
import pg from "pg";
import { DDL, RESET } from "../src/server/ddl.ts";
import { buildSeed } from "../src/server/seed.ts";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env.local, for example:\nDATABASE_URL=postgres://user:password@localhost:5432/pulse");
  process.exit(1);
}
const local = /localhost|127\.0\.0\.1/.test(url);
const client = new pg.Client({ connectionString: url, ssl: local ? undefined : { rejectUnauthorized: true } });
await client.connect();
const t0 = Date.now();

async function insert(table, cols, rows) {
  for (let i = 0; i < rows.length; i += 1000) {
    const chunk = rows.slice(i, i + 1000), vals = [];
    const ph = chunk.map((r, j) => `(${cols.map((c, k) => { vals.push(r[c]); return `$${j * cols.length + k + 1}`; }).join(",")})`);
    await client.query(`INSERT INTO ${table} (${cols.map((c) => c.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase())).join(",")}) VALUES ${ph.join(",")}`, vals);
  }
}

try {
  await client.query("BEGIN");
  if (process.argv.includes("--reset")) await client.query(RESET);
  await client.query(DDL);
  const { rows: [{ n }] } = await client.query("SELECT count(*)::int AS n FROM orders");
  if (n > 0) {
    console.log(`Tables are ready. ${n} orders already exist, so no demo data was added (use --reset to start over).`);
  } else {
    const s = buildSeed();
    await insert("customers", ["id", "name", "email", "country", "createdAt"], s.customers);
    await insert("products", ["id", "name", "category", "priceCents"], s.products);
    await insert("orders", ["id", "customerId", "status", "totalCents", "createdAt"], s.orders);
    await insert("order_items", ["orderId", "productId", "quantity", "unitCents"], s.items);
    for (const t of ["customers", "products", "orders", "order_items"]) await client.query(`SELECT setval(pg_get_serial_sequence('${t}','id'), (SELECT max(id) FROM ${t}))`);
    console.log(`Created tables and added ${s.customers.length} customers, ${s.products.length} products, ${s.orders.length} orders and ${s.items.length} order items.`);
  }
  await client.query("COMMIT");
  console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)}s.`);
} catch (e) {
  await client.query("ROLLBACK");
  console.error("Setup failed:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
