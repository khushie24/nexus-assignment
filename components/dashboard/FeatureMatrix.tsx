"use client";

import type { Competitor, FeatureComparison } from "@/lib/types";
import { Check, X } from "lucide-react";

interface Props {
  features: FeatureComparison[];
  competitors: Competitor[];
}

export default function FeatureMatrix({ features, competitors }: Props) {
  const visibleCompetitors = competitors.slice(0, 5);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs uppercase text-zinc-500">
            <th className="py-3 pr-4">Feature</th>
            <th className="px-4 py-3 text-center text-teal-800">Our product</th>
            {visibleCompetitors.map((competitor) => (
              <th key={competitor.name} className="px-4 py-3 text-center">
                {competitor.name.split(" ")[0]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature.feature} className="border-b border-zinc-100">
              <td className="py-3 pr-4">
                <div className="font-medium text-zinc-950">{feature.feature}</div>
                <div className="text-xs text-zinc-500">
                  {feature.category} / {feature.importance} / {feature.gapReason}
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                {feature.ourProduct ? (
                  <Check className="mx-auto h-5 w-5 text-emerald-600" />
                ) : (
                  <X className="mx-auto h-5 w-5 text-red-500" />
                )}
              </td>
              {visibleCompetitors.map((competitor) => (
                <td key={competitor.name} className="px-4 py-3 text-center">
                  {feature.competitors[competitor.name] ? (
                    <Check className="mx-auto h-5 w-5 text-zinc-700" />
                  ) : (
                    <X className="mx-auto h-5 w-5 text-zinc-300" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
