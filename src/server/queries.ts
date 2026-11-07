import "server-only";
import { and, asc, count, desc, eq, gte, ilike, lt, ne, or, sql, sum } from "drizzle-orm";
import { getDb } from "./db";
import { customers, orderItems, orders, products } from "./schema";
import { periods, type OrdersQuery, type Range } from "@/lib/params";

const revenue = sql<number>`coalesce(sum(${orders.totalCents}) filter (where ${orders.status} <> 'refunded'), 0)`.mapWith(Number);

async function windowStats(start: Date, end: Date) {
  const db = await getDb();
  const [o] = await db
    .select({ revenue, orders: count(), refunded: sql<number>`count(*) filter (where ${orders.status} = 'refunded')`.mapWith(Number) })
    .from(orders)
    .where(and(gte(orders.createdAt, start), lt(orders.createdAt, end)));
  const [c] = await db.select({ n: count() }).from(customers).where(and(gte(customers.createdAt, start), lt(customers.createdAt, end)));
  const paidOrders = o.orders - o.refunded;
  return { revenue: o.revenue, orders: o.orders, aov: paidOrders ? Math.round(o.revenue / paidOrders) : 0, newCustomers: c.n };
}

/** The four headline numbers, each with the same numbers for the previous period. */
export async function getKpis(range: Range) {
  const { start, end, prevStart } = periods(range);
  const [cur, prev] = await Promise.all([windowStats(start, end), windowStats(prevStart, start)]);
  return { cur, prev };
}

/** Revenue and orders per day, week or month, with empty buckets filled in so the chart has no gaps. */
export async function getRevenueSeries(range: Range) {
  const db = await getDb();
  const { start, end, bucket } = periods(range);
  const b = sql.raw(`'${bucket}'`);
  const rows = await db
    .select({ at: sql<string>`date_trunc(${b}, ${orders.createdAt})`.as("at"), revenue, orders: count() })
    .from(orders)
    .where(and(gte(orders.createdAt, start), lt(orders.createdAt, end)))
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  const byKey = new Map(rows.map((r) => [new Date(r.at).toISOString().slice(0, 10), r]));
  const out: { label: string; revenue: number; orders: number }[] = [];
  const cur = new Date(rows[0]?.at ?? start);
  while (cur < end) {
    const key = cur.toISOString().slice(0, 10);
    const r = byKey.get(key);
    const label = bucket === "month" ? cur.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }) : cur.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    out.push({ label, revenue: (r?.revenue ?? 0) / 100, orders: r?.orders ?? 0 });
    if (bucket === "day") cur.setUTCDate(cur.getUTCDate() + 1);
    else if (bucket === "week") cur.setUTCDate(cur.getUTCDate() + 7);
    else cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  return out;
}

export async function getSalesByCategory(range: Range) {
  const db = await getDb();
  const { start, end } = periods(range);
  return db
    .select({ category: products.category, revenue: sql<number>`sum(${orderItems.quantity} * ${orderItems.unitCents})`.mapWith(Number) })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(and(gte(orders.createdAt, start), lt(orders.createdAt, end), ne(orders.status, "refunded")))
    .groupBy(products.category)
    .orderBy(desc(sql`2`));
}

export async function getTopProducts(range: Range, limit = 5) {
  const db = await getDb();
  const { start, end } = periods(range);
  return db
    .select({ name: products.name, category: products.category, units: sum(orderItems.quantity).mapWith(Number), revenue: sql<number>`sum(${orderItems.quantity} * ${orderItems.unitCents})`.mapWith(Number) })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(and(gte(orders.createdAt, start), lt(orders.createdAt, end), ne(orders.status, "refunded")))
    .groupBy(products.id)
    .orderBy(desc(sql`4`))
    .limit(limit);
}

export const PAGE_SIZE = 12;

/** Search, filter, sort and paginate in SQL, so the browser only ever receives one page. */
export async function listOrders(q: OrdersQuery) {
  const db = await getDb();
  const term = q.q ? `%${q.q.replace(/[%_\\]/g, "\\$&")}%` : null;
  const idMatch = /^#?\d+$/.test(q.q) ? Number(q.q.replace("#", "")) : null;
  const where = and(
    q.status ? eq(orders.status, q.status) : undefined,
    term ? or(ilike(customers.name, term), ilike(customers.email, term), idMatch ? eq(orders.id, idMatch) : undefined) : undefined,
  );
  const order = (q.sort === "total" ? orders.totalCents : orders.createdAt);
  const [rows, [{ n }]] = await Promise.all([
    db
      .select({ id: orders.id, status: orders.status, totalCents: orders.totalCents, createdAt: orders.createdAt, customer: customers.name, email: customers.email, country: customers.country })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(where)
      .orderBy(q.dir === "asc" ? asc(order) : desc(order), desc(orders.id))
      .limit(PAGE_SIZE)
      .offset((q.page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(orders).innerJoin(customers, eq(orders.customerId, customers.id)).where(where),
  ]);
  return { rows, total: n, pages: Math.max(1, Math.ceil(n / PAGE_SIZE)) };
}

export async function recentOrders(limit = 6) {
  const db = await getDb();
  return db
    .select({ id: orders.id, status: orders.status, totalCents: orders.totalCents, createdAt: orders.createdAt, customer: customers.name })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

export async function statusCounts() {
  const db = await getDb();
  return db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status);
}
