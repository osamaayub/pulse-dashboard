import "server-only";
import { and, count, desc, eq, gte, lt, ne, sql, sum } from "drizzle-orm";
import { getDb } from "@/server/db";
import { customers, orderItems, orders, products } from "@/server/schema";
import { periods, type Range } from "./range";

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
