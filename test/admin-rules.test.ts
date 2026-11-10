import { describe, expect, it } from "vitest";
import { canTransitionOrderStatus, LOW_STOCK_THRESHOLD } from "../src/features/admin/rules";

describe("admin operational rules", () => {
  it("only allows forward order fulfillment transitions and refunds", () => {
    expect(canTransitionOrderStatus("pending", "paid")).toBe(true);
    expect(canTransitionOrderStatus("paid", "shipped")).toBe(true);
    expect(canTransitionOrderStatus("paid", "refunded")).toBe(true);
    expect(canTransitionOrderStatus("shipped", "refunded")).toBe(true);
    expect(canTransitionOrderStatus("shipped", "paid")).toBe(false);
    expect(canTransitionOrderStatus("refunded", "paid")).toBe(false);
    expect(canTransitionOrderStatus("pending", "shipped")).toBe(false);
  });

  it("uses a single low-stock threshold", () => {
    expect(LOW_STOCK_THRESHOLD).toBe(10);
  });
});
