"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "./db";
import { orders } from "./schema";

const idSchema = z.coerce.number().int().positive();

export type ShipResult = { ok: true; id: number } | { ok: false; error: string };

/** Paid orders can be marked as shipped. The status check happens in the UPDATE itself, so double clicks are harmless. */
export async function markShipped(_prev: ShipResult | null, form: FormData): Promise<ShipResult> {
  const parsed = idSchema.safeParse(form.get("id"));
  if (!parsed.success) return { ok: false, error: "Unknown order." };
  const db = await getDb();
  const updated = await db
    .update(orders)
    .set({ status: "shipped" })
    .where(and(eq(orders.id, parsed.data), inArray(orders.status, ["paid"])))
    .returning({ id: orders.id });
  if (!updated.length) return { ok: false, error: "Only paid orders can be shipped." };
  revalidatePath("/orders");
  revalidatePath("/");
  return { ok: true, id: parsed.data };
}
