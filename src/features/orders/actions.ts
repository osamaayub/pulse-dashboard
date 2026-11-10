"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/server/admin-auth";
import { getDb } from "@/server/db";
import { auditLog, orders } from "@/server/schema";
import type { Status } from "./params";

const idSchema = z.coerce.number().int().positive();

export type ActionResult = { ok: true; id: number } | { ok: false; error: string };
/** Kept for existing imports. */
export type ShipResult = ActionResult;

/**
 * Moves an order to a new status, but only from the statuses listed.
 * The check is part of the UPDATE itself, so double clicks and two admins clicking at once are harmless.
 */
async function moveOrder(form: FormData, to: Status, from: Status[], error: string): Promise<ActionResult> {
  const actor = await requireAdmin();
  const parsed = idSchema.safeParse(form.get("id"));
  if (!parsed.success) return { ok: false, error: "Unknown order." };
  const db = await getDb();
  const updated = await db.transaction(async (tx) => {
    const [order] = await tx.select({ status: orders.status }).from(orders).where(eq(orders.id, parsed.data)).for("update");
    if (!order || !from.includes(order.status)) return false;
    await tx.update(orders).set({ status: to }).where(and(eq(orders.id, parsed.data), inArray(orders.status, from)));
    await tx.insert(auditLog).values({
      actorEmail: actor,
      action: `order.${to}`,
      entityType: "order",
      entityId: String(parsed.data),
      summary: `Order #${parsed.data} moved from ${order.status} to ${to}.`,
    });
    return true;
  });
  if (!updated) return { ok: false, error };
  revalidatePath("/", "layout"); // overview, orders, the order page, customers and products all show this order
  return { ok: true, id: parsed.data };
}

/** Paid orders can be marked as shipped. */
export async function markShipped(_prev: ActionResult | null, form: FormData) {
  return moveOrder(form, "shipped", ["paid"], "Only paid orders can be shipped.");
}

/** Paid or shipped orders can be refunded. Refunded orders no longer count as revenue. */
export async function refundOrder(_prev: ActionResult | null, form: FormData) {
  return moveOrder(form, "refunded", ["paid", "shipped"], "Only paid or shipped orders can be refunded.");
}
