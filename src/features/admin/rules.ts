import type { Status } from "@/features/orders/params";

export const LOW_STOCK_THRESHOLD = 10;

const ORDER_TRANSITIONS: Record<Status, readonly Status[]> = {
  pending: ["paid"],
  paid: ["shipped", "refunded"],
  shipped: ["refunded"],
  refunded: [],
};

export function canTransitionOrderStatus(from: Status, to: Status) {
  return ORDER_TRANSITIONS[from].includes(to);
}
