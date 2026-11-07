import { z } from "zod";

export const STATUSES = ["pending", "paid", "shipped", "refunded"] as const;
export type Status = (typeof STATUSES)[number];

const one = (v: unknown) => (Array.isArray(v) ? v[0] : v);

/** URL search params are user input: parse them, and fall back to safe defaults instead of throwing. */
export const ordersQuerySchema = z.object({
  q: z.preprocess(one, z.string().trim().max(60).catch("")).default(""),
  status: z.preprocess(one, z.enum(STATUSES).optional().catch(undefined)),
  sort: z.preprocess(one, z.enum(["date", "total"]).catch("date")).default("date"),
  dir: z.preprocess(one, z.enum(["asc", "desc"]).catch("desc")).default("desc"),
  page: z.preprocess(one, z.coerce.number().int().min(1).max(500).catch(1)).default(1),
});
export type OrdersQuery = z.infer<typeof ordersQuerySchema>;
