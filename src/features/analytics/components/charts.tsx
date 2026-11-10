"use client";

import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const usd = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(v);

export function RevenueChart({ data }: { data: { label: string; revenue: number; orders: number }[] }) {
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue");
  const formatter = metric === "revenue" ? usd : (value: number) => new Intl.NumberFormat("en-US").format(value);
  return (
    <div>
      <div className="mb-2 flex justify-end" role="group" aria-label="Chart metric">
        {(["revenue", "orders"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setMetric(option)}
            aria-pressed={metric === option}
            className={`min-h-9 rounded-lg px-3 text-xs font-medium capitalize outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand ${metric === option ? "bg-brand-soft text-brand" : "text-muted hover:bg-canvas"}`}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="h-60 sm:h-72" role="img" aria-label={`${metric === "revenue" ? "Revenue" : "Orders"} over time`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 4, top: 8 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#e3e7ef" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#5b6478", fontSize: 10 }} minTickGap={28} />
            <YAxis tickFormatter={formatter} tickLine={false} axisLine={false} tick={{ fill: "#5b6478", fontSize: 10 }} width={48} />
            <Tooltip formatter={(v) => [formatter(Number(v)), metric === "revenue" ? "Revenue" : "Orders"]} contentStyle={{ borderRadius: 12, border: "1px solid #e3e7ef", fontSize: 13 }} />
            <Area type="monotone" dataKey={metric} stroke="#4f46e5" strokeWidth={2.5} fill="url(#rev)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CategoryChart({ data }: { data: { category: string; revenue: number }[] }) {
  const rows = data.map((d) => ({ ...d, revenue: d.revenue / 100 }));
  return (
    <div className="h-60 sm:h-72" role="img" aria-label="Revenue by category">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid horizontal={false} stroke="#e3e7ef" />
          <XAxis type="number" tickFormatter={usd} tickLine={false} axisLine={false} tick={{ fill: "#5b6478", fontSize: 10 }} />
          <YAxis type="category" dataKey="category" tickLine={false} axisLine={false} tick={{ fill: "#0d1324", fontSize: 11 }} width={80} />
          <Tooltip formatter={(v) => [usd(Number(v)), "Revenue"]} cursor={{ fill: "#eef0ff" }} contentStyle={{ borderRadius: 12, border: "1px solid #e3e7ef", fontSize: 13 }} />
          <Bar dataKey="revenue" fill="#0f9f94" radius={[0, 6, 6, 0]} barSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
