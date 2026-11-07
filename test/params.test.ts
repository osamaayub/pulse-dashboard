import { describe, expect, it } from "vitest";
import { delta, periods, rangeSchema } from "../src/features/analytics/range";
import { ordersQuerySchema } from "../src/features/orders/params";
import { withParams } from "../src/lib/url";
import { buildSeed } from "../src/server/seed";

describe("URL params are parsed safely", () => {
  it("falls back to 30 days for a bad range", () => {
    expect(rangeSchema.parse("1y")).toBe("30d");
    expect(rangeSchema.parse(["7d", "12m"])).toBe("7d");
  });
  it("cleans the orders query", () => {
    const q = ordersQuerySchema.parse({ q: "  ava ", status: "nope", page: "-3", sort: "drop table" });
    expect(q).toEqual({ q: "ava", status: undefined, sort: "date", dir: "desc", page: 1 });
  });
  it("builds links without empty values", () => {
    expect(withParams({ q: "", status: "paid" }, { page: 2 })).toBe("?status=paid&page=2");
    expect(withParams({}, {})).toBe("");
  });
});

describe("numbers", () => {
  it("compares with the previous period", () => {
    expect(delta(120, 100)).toBeCloseTo(0.2);
    expect(delta(0, 0)).toBe(0);
  });
  it("uses bigger buckets for longer ranges", () => {
    expect(periods("7d").bucket).toBe("day");
    expect(periods("90d").bucket).toBe("week");
    expect(periods("12m").bucket).toBe("month");
  });
  it("seeds the same store every time", () => {
    const now = Date.UTC(2026, 10, 1);
    const a = buildSeed(now), b = buildSeed(now);
    expect(a.orders.length).toBe(b.orders.length);
    expect(a.orders[100]).toEqual(b.orders[100]);
    const sum = a.items.filter((i) => i.orderId === 1).reduce((s, i) => s + i.quantity * i.unitCents, 0);
    expect(a.orders[0].totalCents).toBe(sum);
  });
});
