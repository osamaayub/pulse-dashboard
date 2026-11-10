import "server-only";

import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { auditLog, customers, orders, products } from "@/server/schema";
import { likePattern } from "@/lib/search";
import { LOW_STOCK_THRESHOLD } from "./rules";

export async function adminProducts(lowStockOnly = false) {
  const db = await getDb();
  return db
    .select()
    .from(products)
    .where(lowStockOnly ? and(eq(products.isActive, true), sql`${products.stockQuantity} <= ${LOW_STOCK_THRESHOLD}`) : undefined)
    .orderBy(asc(products.name));
}

export async function adminCustomers(search = "") {
  const db = await getDb();
  const term = search ? likePattern(search) : null;
  return db
    .select({ id: customers.id, name: customers.name, email: customers.email, country: customers.country, isActive: customers.isActive })
    .from(customers)
    .where(term ? or(ilike(customers.name, term), ilike(customers.email, term)) : undefined)
    .orderBy(asc(customers.name))
    .limit(50);
}

export async function adminCustomer(id: number) {
  const db = await getDb();
  const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return customer ?? null;
}

export async function adminOrders() {
  const db = await getDb();
  return db
    .select({
      id: orders.id,
      status: orders.status,
      totalCents: orders.totalCents,
      createdAt: orders.createdAt,
      customer: customers.name,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .limit(50);
}

export async function recentAdminActivity() {
  const db = await getDb();
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt), desc(auditLog.id)).limit(100);
}

export async function adminCounts() {
  const db = await getDb();
  const [productCount, customerCount, lowStock, orderCount] = await Promise.all([
    db.select({ n: count() }).from(products).where(eq(products.isActive, true)),
    db.select({ n: count() }).from(customers).where(eq(customers.isActive, true)),
    db.select({ n: count() }).from(products).where(and(eq(products.isActive, true), sql`${products.stockQuantity} <= ${LOW_STOCK_THRESHOLD}`)),
    db.select({ n: count() }).from(orders),
  ]);
  return { products: productCount[0].n, customers: customerCount[0].n, lowStock: lowStock[0].n, orders: orderCount[0].n };
}
