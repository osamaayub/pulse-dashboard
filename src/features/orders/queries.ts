import "server-only";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { getDb } from "@/server/db";
import { customers, orders } from "@/server/schema";
import type { OrdersQuery } from "./params";

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
