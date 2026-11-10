"use server";

import { and, eq, isNull, ne } from "drizzle-orm";
import { createAdminInvitationToken, adminInvitationExpiresAt, hashInvitationToken } from "@/lib/admin-invitation-token";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminEmail } from "@/lib/admin-auth";
import { requireAdmin } from "@/server/admin-auth";
import { getDb, type DB } from "@/server/db";
import { adminInvitations, adminUsers, auditLog, customers, orders, products } from "@/server/schema";
import { canTransitionOrderStatus } from "./rules";

export type AdminActionState = { ok: boolean; message: string } | null;

export type InviteActionState = { ok: boolean; message: string; invitePath?: string } | null;

const idField = z.preprocess((value) => value === "" || value == null ? undefined : value, z.coerce.number().int().positive().optional());
const productFields = z.object({
  id: idField,
  name: z.string().trim().min(2).max(100),
  category: z.string().trim().min(2).max(40),
  price: z.preprocess((value) => value === "" ? undefined : value, z.coerce.number().finite().min(0.01).max(1_000_000)),
  stockQuantity: z.preprocess((value) => value === "" ? undefined : value, z.coerce.number().int().min(0).max(1_000_000)),
});

function formValues(form: FormData) {
  return Object.fromEntries(form.entries());
}

function refreshAdminData() {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

function writeAudit(tx: Tx, actorEmail: string, action: string, entityType: string, entityId: number, summary: string) {
  return tx.insert(auditLog).values({ actorEmail, action, entityType, entityId: String(entityId), summary });
}

const invitationFields = z.object({ email: z.string().trim().email().max(254) });

export async function createAdminInvitation(_previous: InviteActionState, form: FormData): Promise<InviteActionState> {
  const actor = await requireAdmin();
  const parsed = invitationFields.safeParse(formValues(form));
  if (!parsed.success) return { ok: false, message: "Enter a valid email address." };
  const email = parsed.data.email.toLowerCase();
  if (isAdminEmail(email)) return { ok: false, message: "That email already has administrator access." };
  const db = await getDb();
  const [existingAdmin] = await db.select({ email: adminUsers.email }).from(adminUsers)
    .where(and(eq(adminUsers.email, email), eq(adminUsers.isActive, true))).limit(1);
  if (existingAdmin) return { ok: false, message: "That email already has administrator access." };

  const token = createAdminInvitationToken();
  const expiresAt = adminInvitationExpiresAt();
  await db.transaction(async (tx) => {
    await tx.delete(adminInvitations).where(and(eq(adminInvitations.email, email), isNull(adminInvitations.acceptedAt)));
    await tx.insert(adminInvitations).values({
      email,
      tokenHash: hashInvitationToken(token),
      invitedByEmail: actor,
      expiresAt,
    });
    await tx.insert(auditLog).values({
      actorEmail: actor,
      action: "admin.invitation_created",
      entityType: "admin",
      entityId: email,
      summary: `Created administrator invitation for ${email}; expires ${expiresAt.toISOString()}.`,
    });
  });
  refreshAdminData();
  return { ok: true, message: "Invitation created. Copy and share this link; it expires in 24 hours.", invitePath: `/admin/invite?token=${token}` };
}

export async function revokeAdminInvitation(_previous: AdminActionState, form: FormData): Promise<AdminActionState> {
  const actor = await requireAdmin();
  const parsedId = z.coerce.number().int().positive().safeParse(form.get("id"));
  if (!parsedId.success) return { ok: false, message: "Choose a valid invitation." };
  const db = await getDb();
  const revoked = await db.transaction(async (tx) => {
    const [invitation] = await tx.delete(adminInvitations)
      .where(and(eq(adminInvitations.id, parsedId.data), isNull(adminInvitations.acceptedAt)))
      .returning({ email: adminInvitations.email });
    if (!invitation) return false;
    await tx.insert(auditLog).values({
      actorEmail: actor,
      action: "admin.invitation_revoked",
      entityType: "admin",
      entityId: invitation.email,
      summary: `Revoked administrator invitation for ${invitation.email}.`,
    });
    return true;
  });
  if (!revoked) return { ok: false, message: "Invitation not found or already accepted." };
  refreshAdminData();
  return { ok: true, message: "Invitation revoked." };
}

export async function saveProduct(_previous: AdminActionState, form: FormData): Promise<AdminActionState> {
  const actor = await requireAdmin();
  const parsed = productFields.safeParse(formValues(form));
  if (!parsed.success) return { ok: false, message: "Check the product name, category, price and stock quantity." };
  const { id, name, category, price, stockQuantity } = parsed.data;
  const isActive = form.get("isActive") === "on";
  const db = await getDb();
  const updated = await db.transaction(async (tx) => {
    if (id) {
      const [existing] = await tx.select({
        id: products.id,
        name: products.name,
        priceCents: products.priceCents,
        stockQuantity: products.stockQuantity,
        isActive: products.isActive,
      }).from(products).where(eq(products.id, id)).for("update");
      if (!existing) return false;
      await tx.update(products).set({ name, category, priceCents: Math.round(price * 100), stockQuantity, isActive }).where(eq(products.id, id));
      const changes = [
        existing.priceCents !== Math.round(price * 100) ? `price ${existing.priceCents}¢ → ${Math.round(price * 100)}¢` : null,
        existing.stockQuantity !== stockQuantity ? `stock ${existing.stockQuantity} → ${stockQuantity}` : null,
      ].filter((change): change is string => change !== null);
      const summary = `${isActive ? "Updated" : "Archived"} product ${name}${changes.length ? ` (${changes.join(", ")})` : ""}.`;
      await writeAudit(tx, actor, "product.updated", "product", id, summary);
    } else {
      const [product] = await tx.insert(products).values({ name, category, priceCents: Math.round(price * 100), stockQuantity, isActive }).returning({ id: products.id });
      await writeAudit(tx, actor, "product.created", "product", product.id, `Created product ${name}.`);
    }
    return true;
  });
  if (!updated) return { ok: false, message: "Product not found." };
  refreshAdminData();
  return { ok: true, message: id ? "Product updated." : "Product created." };
}

const stockFields = z.object({
  id: z.coerce.number().int().positive(),
  stockQuantity: z.preprocess((value) => value === "" ? undefined : value, z.coerce.number().int().min(0).max(1_000_000)),
});

export async function updateStock(_previous: AdminActionState, form: FormData): Promise<AdminActionState> {
  const actor = await requireAdmin();
  const parsed = stockFields.safeParse(formValues(form));
  if (!parsed.success) return { ok: false, message: "Enter a valid non-negative stock quantity." };
  const db = await getDb();
  const changed = await db.transaction(async (tx) => {
    const [product] = await tx.select({ name: products.name, stockQuantity: products.stockQuantity }).from(products).where(eq(products.id, parsed.data.id)).for("update");
    if (!product) return false;
    await tx.update(products).set({ stockQuantity: parsed.data.stockQuantity }).where(eq(products.id, parsed.data.id));
    await writeAudit(tx, actor, "inventory.adjusted", "product", parsed.data.id, `${product.name}: stock changed from ${product.stockQuantity} to ${parsed.data.stockQuantity}.`);
    return true;
  });
  if (!changed) return { ok: false, message: "Product not found." };
  refreshAdminData();
  return { ok: true, message: "Stock updated." };
}

const orderFields = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(["pending", "paid", "shipped", "refunded"]),
});

export async function updateOrderStatus(_previous: AdminActionState, form: FormData): Promise<AdminActionState> {
  const actor = await requireAdmin();
  const parsed = orderFields.safeParse(formValues(form));
  if (!parsed.success) return { ok: false, message: "Choose a valid order status." };
  const db = await getDb();
  const result = await db.transaction(async (tx) => {
    const [order] = await tx.select({ status: orders.status }).from(orders).where(eq(orders.id, parsed.data.id)).for("update");
    if (!order) return { ok: false as const, message: "Order not found." };
    if (order.status === parsed.data.status) return { ok: true as const, message: "No changes were needed." };
    if (!canTransitionOrderStatus(order.status, parsed.data.status)) {
      return { ok: false as const, message: `An order cannot move from ${order.status} to ${parsed.data.status}.` };
    }
    await tx.update(orders).set({ status: parsed.data.status }).where(eq(orders.id, parsed.data.id));
    await writeAudit(tx, actor, "order.status_changed", "order", parsed.data.id, `Order #${parsed.data.id}: ${order.status} → ${parsed.data.status}.`);
    return { ok: true as const, message: "Order status updated." };
  });
  if (!result.ok || result.message === "No changes were needed.") return result;
  refreshAdminData();
  return result;
}

const customerFields = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  country: z.string().trim().min(2).max(80),
});

export async function saveCustomer(_previous: AdminActionState, form: FormData): Promise<AdminActionState> {
  const actor = await requireAdmin();
  const parsed = customerFields.safeParse(formValues(form));
  if (!parsed.success) return { ok: false, message: "Enter a valid name, email and country." };
  const { id, name, country } = parsed.data;
  const email = parsed.data.email.toLowerCase();
  const isActive = form.get("isActive") === "on";
  const db = await getDb();
  const [duplicate] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.email, email), ne(customers.id, id)))
    .limit(1);
  if (duplicate) return { ok: false, message: "Another customer already uses that email." };
  const updated = await db.transaction(async (tx) => {
    const [customer] = await tx.update(customers).set({ name, email, country, isActive }).where(eq(customers.id, id)).returning({ id: customers.id });
    if (!customer) return false;
    await writeAudit(tx, actor, "customer.updated", "customer", id, `${isActive ? "Updated" : "Deactivated"} customer ${name}.`);
    return true;
  });
  if (!updated) return { ok: false, message: "Customer not found." };
  refreshAdminData();
  return { ok: true, message: "Customer record updated." };
}
