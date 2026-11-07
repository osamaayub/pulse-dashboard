import { money, num } from "@/lib/format";
import { customerSummary } from "../queries";

export async function CustomerSummary() {
  const s = await customerSummary();
  const cards = [
    { label: "Customers", value: num(s.customers) },
    { label: "Have ordered", value: num(s.buyers) },
    { label: "Ordered again", value: s.buyers ? `${Math.round((s.repeat / s.buyers) * 100)}%` : "0%", hint: `${num(s.repeat)} repeat customers` },
    { label: "Average lifetime value", value: money(s.avgLtv) },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-line bg-panel p-5">
          <p className="text-sm text-muted">{c.label}</p>
          <p className="num mt-2 text-2xl font-semibold tracking-tight">{c.value}</p>
          {c.hint && <p className="num mt-1 text-xs text-muted">{c.hint}</p>}
        </div>
      ))}
    </div>
  );
}
