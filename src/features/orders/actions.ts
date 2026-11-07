"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/server/db";
import { orders } from "@/server/schema";
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
  const parsed = idSchema.safeParse(form.get("id"));
  if (!parsed.success) return { ok: false, error: "Unknown order." };
  const db = await getDb();
  const updated = await db
    .update(orders)
    .set({ status: to })
    .where(and(eq(orders.id, parsed.data), inArray(orders.status, from)))
    .returning({ id: orders.id });
  if (!updated.length) return { ok: false, error };
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
