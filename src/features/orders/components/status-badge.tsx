import type { Status } from "../params";

const STATUS_STYLE: Record<Status, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  paid: "bg-brand-soft text-brand ring-indigo-200",
  shipped: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  refunded: "bg-slate-100 text-slate-600 ring-slate-200",
};
export function StatusBadge({ status }: { status: Status }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${STATUS_STYLE[status]}`}>{status}</span>;
}
