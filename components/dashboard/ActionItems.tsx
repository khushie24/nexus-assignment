"use client";

import type { ActionItem } from "@/lib/types";
import { Hammer, Megaphone, Phone, Search } from "lucide-react";

interface Props {
  actions: ActionItem[];
}

const config = {
  build: { icon: Hammer, label: "Build", className: "bg-teal-50 text-teal-800 border-teal-200" },
  market: { icon: Megaphone, label: "Market", className: "bg-amber-50 text-amber-800 border-amber-200" },
  sales: { icon: Phone, label: "Sales", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  research: { icon: Search, label: "Research", className: "bg-zinc-50 text-zinc-700 border-zinc-200" },
};

export default function ActionItems({ actions }: Props) {
  return (
    <div className="space-y-3">
      {actions.map((item) => {
        const itemConfig = config[item.category];
        const Icon = itemConfig.icon;

        return (
          <div
            key={`${item.category}-${item.action}`}
            className="rounded-md border border-zinc-200 bg-zinc-50 p-4"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${itemConfig.className}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {itemConfig.label}
              </span>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-zinc-500">
                {item.urgency.replace("-", " ")}
              </span>
            </div>
            <div className="font-semibold text-zinc-950">{item.action}</div>
            <p className="mt-1 text-sm leading-6 text-zinc-600">{item.reasoning}</p>
          </div>
        );
      })}
    </div>
  );
}
