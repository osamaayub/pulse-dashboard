import "server-only";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { getDb } from "@/server/db";
import { customers, orderItems, orders, products } from "@/server/schema";
import { idFromSearch, likePattern } from "@/lib/search";
import type { OrdersQuery } from "./params";

export const PAGE_SIZE = 12;

/** The WHERE and ORDER BY for a query, shared by the table and the CSV export so both show the same rows. */
function filters(q: OrdersQuery) {
  const term = q.q ? likePattern(q.q) : null;
  const idMatch = idFromSearch(q.q);
  const where = and(
    q.status ? eq(orders.status, q.status) : undefined,
    term ? or(ilike(customers.name, term), ilike(customers.email, term), idMatch ? eq(orders.id, idMatch) : undefined) : undefined,
  );
  const col = q.sort === "total" ? orders.totalCents : orders.createdAt;
  return { where, orderBy: [q.dir === "asc" ? asc(col) : desc(col), desc(orders.id)] };
}

const row = { id: orders.id, customerId: orders.customerId, status: orders.status, totalCents: orders.totalCents, createdAt: orders.createdAt, customer: customers.name, email: customers.email, country: customers.country };

/** Search, filter, sort and paginate in SQL, so the browser only ever receives one page. */
export async function listOrders(q: OrdersQuery) {
  const db = await getDb();
  const { where, orderBy } = filters(q);
  const [rows, [{ n }]] = await Promise.all([
    db.select(row).from(orders).innerJoin(customers, eq(orders.customerId, customers.id)).where(where).orderBy(...orderBy).limit(PAGE_SIZE).offset((q.page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(orders).innerJoin(customers, eq(orders.customerId, customers.id)).where(where),
  ]);
  return { rows, total: n, pages: Math.max(1, Math.ceil(n / PAGE_SIZE)) };
}

export const EXPORT_LIMIT = 10_000;

/** Every row of the current view (ignoring the page), in one query, for the CSV download. */
export async function exportOrders(q: OrdersQuery) {
  const db = await getDb();
  const { where, orderBy } = filters(q);
  return db.select(row).from(orders).innerJoin(customers, eq(orders.customerId, customers.id)).where(where).orderBy(...orderBy).limit(EXPORT_LIMIT);
}

export async function recentOrders(limit = 6) {
  const db = await getDb();
  return db
    .select({ id: orders.id, customerId: orders.customerId, status: orders.status, totalCents: orders.totalCents, createdAt: orders.createdAt, customer: customers.name })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

export async function statusCounts() {
  const db = await getDb();
  return db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status);
}

/** One order with its customer and line items, or null if it doesn't exist. */
export async function getOrder(id: number) {
  const db = await getDb();
  const [order] = await db
    .select({ ...row, customerSince: customers.createdAt })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.id, id));
  if (!order) return null;
  const items = await db
    .select({ id: orderItems.id, productId: products.id, product: products.name, category: products.category, quantity: orderItems.quantity, unitCents: orderItems.unitCents })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id))
    .orderBy(asc(orderItems.id));
  return { ...order, items };
}
