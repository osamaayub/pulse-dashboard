import "server-only";
import { asc, count, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { idFromSearch, likePattern } from "@/lib/search";
import { getDb } from "@/server/db";
import { customers, orderItems, orders, products } from "@/server/schema";
import type { CustomersQuery } from "./params";

export const CUSTOMERS_PAGE_SIZE = 15;

/** Lifetime value: everything the customer paid, minus refunded orders. */
const ltv = sql<number>`coalesce(sum(${orders.totalCents}) filter (where ${orders.status} <> 'refunded'), 0)`.mapWith(Number);
const orderCount = sql<number>`count(${orders.id})`.mapWith(Number);
const lastOrder = sql<Date | null>`max(${orders.createdAt})`.mapWith((v) => (v ? new Date(v) : null));

function where(q: CustomersQuery) {
  if (!q.q) return undefined;
  const id = idFromSearch(q.q);
  const term = likePattern(q.q);
  return or(ilike(customers.name, term), ilike(customers.email, term), ilike(customers.country, term), id ? eq(customers.id, id) : undefined);
}

/** Customers with lifetime value, order count and last order, sorted and paged in SQL. */
export async function listCustomers(q: CustomersQuery) {
  const db = await getDb();
  const w = where(q);
  const dir = q.dir === "asc" ? asc : desc;
  const sortCol = { ltv, orders: orderCount, recent: lastOrder, name: customers.name }[q.sort];
  const [rows, [{ n }]] = await Promise.all([
    db
      .select({ id: customers.id, name: customers.name, email: customers.email, country: customers.country, since: customers.createdAt, ltv, orders: orderCount, lastOrder })
      .from(customers)
      .leftJoin(orders, eq(orders.customerId, customers.id))
      .where(w)
      .groupBy(customers.id)
      .orderBy(q.sort === "recent" ? sql`${lastOrder} ${sql.raw(q.dir === "asc" ? "asc" : "desc")} nulls last` : dir(sortCol), asc(customers.id))
      .limit(CUSTOMERS_PAGE_SIZE)
      .offset((q.page - 1) * CUSTOMERS_PAGE_SIZE),
    db.select({ n: count() }).from(customers).where(w),
  ]);
  return { rows, total: n, pages: Math.max(1, Math.ceil(n / CUSTOMERS_PAGE_SIZE)) };
}

/** Store-wide numbers for the header cards, in one pass over customers and their orders. */
export async function customerSummary() {
  const db = await getDb();
  const res = (await db.execute(sql`
    SELECT count(*)::int AS customers,
           count(*) FILTER (WHERE n > 0)::int AS buyers,
           count(*) FILTER (WHERE n > 1)::int AS repeat,
           coalesce(sum(spent), 0)::bigint AS revenue
    FROM (
      SELECT c.id, count(o.id) AS n, sum(o.total_cents) FILTER (WHERE o.status <> 'refunded') AS spent
      FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
      GROUP BY c.id
    ) per_customer`)) as unknown as { rows: { customers: number; buyers: number; repeat: number; revenue: string | number }[] };
  const r = res.rows[0];
  const revenue = Number(r.revenue);
  return { customers: r.customers, buyers: r.buyers, repeat: r.repeat, avgLtv: r.buyers ? Math.round(revenue / r.buyers) : 0 };
}

/** One customer with totals, favourite category and every order, or null if they don't exist. */
export async function getCustomer(id: number) {
  const db = await getDb();
  const [c] = await db
    .select({ id: customers.id, name: customers.name, email: customers.email, country: customers.country, since: customers.createdAt, ltv, orders: orderCount, lastOrder })
    .from(customers)
    .leftJoin(orders, eq(orders.customerId, customers.id))
    .where(eq(customers.id, id))
    .groupBy(customers.id);
  if (!c) return null;
  const [history, cats] = await Promise.all([
    db.select({ id: orders.id, status: orders.status, totalCents: orders.totalCents, createdAt: orders.createdAt }).from(orders).where(eq(orders.customerId, id)).orderBy(desc(orders.createdAt)).limit(100),
    db
      .select({ category: products.category, spent: sql<number>`sum(${orderItems.quantity} * ${orderItems.unitCents})`.mapWith(Number) })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(sql`${orders.customerId} = ${id} and ${ne(orders.status, "refunded")}`)
      .groupBy(products.category)
      .orderBy(desc(sql`2`)),
  ]);
  const paid = history.filter((o) => o.status !== "refunded").length;
  return { ...c, aov: paid ? Math.round(c.ltv / paid) : 0, history, categories: cats };
}
