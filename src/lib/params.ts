import { z } from "zod";

export const RANGES = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 } as const;
export type Range = keyof typeof RANGES;
export const STATUSES = ["pending", "paid", "shipped", "refunded"] as const;
export type Status = (typeof STATUSES)[number];

const one = (v: unknown) => (Array.isArray(v) ? v[0] : v);

/** URL search params are user input: parse them, and fall back to safe defaults instead of throwing. */
export const rangeSchema = z.preprocess(one, z.enum(["7d", "30d", "90d", "12m"]).catch("30d"));

export const ordersQuerySchema = z.object({
  q: z.preprocess(one, z.string().trim().max(60).catch("")).default(""),
  status: z.preprocess(one, z.enum(STATUSES).optional().catch(undefined)),
  sort: z.preprocess(one, z.enum(["date", "total"]).catch("date")).default("date"),
  dir: z.preprocess(one, z.enum(["asc", "desc"]).catch("desc")).default("desc"),
  page: z.preprocess(one, z.coerce.number().int().min(1).max(500).catch(1)).default(1),
});
export type OrdersQuery = z.infer<typeof ordersQuerySchema>;

/** Current window and the window right before it, for "vs previous period" deltas. */
export function periods(range: Range, now = new Date()) {
  const days = RANGES[range];
  const end = now;
  const start = new Date(end.getTime() - days * 86_400_000);
  const prevStart = new Date(start.getTime() - days * 86_400_000);
  return { start, end, prevStart, bucket: days <= 30 ? ("day" as const) : days <= 90 ? ("week" as const) : ("month" as const) };
}

export function delta(cur: number, prev: number) {
  if (prev === 0) return cur === 0 ? 0 : 1;
  return (cur - prev) / prev;
}

export function withParams(base: Record<string, string | number | undefined>, patch: Record<string, string | number | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...base, ...patch })) if (v !== undefined && v !== "" ) p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}
