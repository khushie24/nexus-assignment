"use client";

import type { MarketLandscapeItem } from "@/lib/types";

interface Props {
  items: MarketLandscapeItem[];
}

export default function MarketOverview({ items }: Props) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.segment} className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="font-semibold text-zinc-950">{item.segment}</div>
            <div className="text-xs text-zinc-500">
              Opportunity {item.opportunity}/100
            </div>
          </div>
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-teal-700"
              style={{ width: `${item.opportunity}%` }}
            />
          </div>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: `${item.intensity}%` }}
            />
          </div>
          <p className="text-sm leading-6 text-zinc-600">{item.note}</p>
        </div>
      ))}
    </div>
  );
}
