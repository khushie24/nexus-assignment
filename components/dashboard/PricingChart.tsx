"use client";

import type { Competitor } from "@/lib/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  competitors: Competitor[];
}

export default function PricingChart({ competitors }: Props) {
  const data = competitors
    .filter((competitor) => competitor.monthlyPrice !== null)
    .map((competitor) => ({
      name: competitor.name.split(" ")[0],
      price: competitor.monthlyPrice,
    }));

  if (data.length === 0) {
    return (
      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
        Public pricing is not available for this competitor set. The dashboard
        keeps those competitors in the table and positioning map as enterprise
        or unknown pricing.
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fill: "#52525b", fontSize: 12 }} />
          <YAxis tick={{ fill: "#52525b", fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
          <Tooltip
            formatter={(value) => [`$${value}/month`, "Starting price"]}
            contentStyle={{ borderRadius: 6, borderColor: "#d4d4d8" }}
          />
          <Bar dataKey="price" fill="#0f766e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
