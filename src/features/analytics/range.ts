import { z } from "zod";

export const RANGES = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 } as const;
export type Range = keyof typeof RANGES;

const one = (v: unknown) => (Array.isArray(v) ? v[0] : v);

/** ?range= is user input: anything unknown falls back to 30 days instead of throwing. */
export const rangeSchema = z.preprocess(one, z.enum(["7d", "30d", "90d", "12m"]).catch("30d"));

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
