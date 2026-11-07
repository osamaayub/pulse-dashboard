import "server-only";
import { and, asc, eq, gte, lt, ne, sql } from "drizzle-orm";
import { delta, periods } from "@/features/analytics/range";
import { getDb } from "@/server/db";
import { orderItems, orders, products } from "@/server/schema";
import type { ProductsQuery } from "./params";

/** Units, revenue and orders per product between two dates (refunds excluded). */
async function salesBetween(start: Date, end: Date) {
  const db = await getDb();
  return db
    .select({
      productId: orderItems.productId,
      units: sql<number>`sum(${orderItems.quantity})`.mapWith(Number),
      revenue: sql<number>`sum(${orderItems.quantity} * ${orderItems.unitCents})`.mapWith(Number),
      orders: sql<number>`count(distinct ${orderItems.orderId})`.mapWith(Number),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(gte(orders.createdAt, start), lt(orders.createdAt, end), ne(orders.status, "refunded")))
    .groupBy(orderItems.productId);
}

/** Every product (even ones that sold nothing), with this period's sales, the change vs the last period, and share of revenue. */
export async function productPerformance(q: ProductsQuery) {
  const db = await getDb();
  const { start, end, prevStart } = periods(q.range);
  const [all, cur, prev] = await Promise.all([
    db.select().from(products).orderBy(asc(products.name)),
    salesBetween(start, end),
    salesBetween(prevStart, start),
  ]);
  const curBy = new Map(cur.map((r) => [r.productId, r]));
  const prevBy = new Map(prev.map((r) => [r.productId, r]));
  const categories = [...new Set(all.map((p) => p.category))].sort();
  const totalRevenue = cur.reduce((a, r) => a + r.revenue, 0);
  const rows = all
    .filter((p) => !q.category || p.category === q.category)
    .map((p) => {
      const c = curBy.get(p.id), before = prevBy.get(p.id)?.revenue ?? 0;
      const revenue = c?.revenue ?? 0;
      return { ...p, units: c?.units ?? 0, orders: c?.orders ?? 0, revenue, growth: delta(revenue, before), share: totalRevenue ? revenue / totalRevenue : 0 };
    });
  const by = { revenue: (r: (typeof rows)[number]) => -r.revenue, units: (r: (typeof rows)[number]) => -r.units, growth: (r: (typeof rows)[number]) => -r.growth, name: () => 0 }[q.sort];
  rows.sort((a, b) => by(a) - by(b) || a.name.localeCompare(b.name));
  return { rows, categories, totalRevenue };
}
