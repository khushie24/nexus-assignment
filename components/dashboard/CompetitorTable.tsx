"use client";

import type { Competitor } from "@/lib/types";
import { CheckCircle2, ExternalLink } from "lucide-react";

interface Props {
  competitors: Competitor[];
}

export default function CompetitorTable({ competitors }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
            <th className="py-3 pr-4">Competitor</th>
            <th className="px-4 py-3">Offering</th>
            <th className="px-4 py-3">Pricing</th>
            <th className="px-4 py-3">Positioning</th>
            <th className="px-4 py-3">Strengths</th>
            <th className="px-4 py-3">Weaknesses</th>
            <th className="px-4 py-3">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {competitors.map((competitor) => (
            <tr key={competitor.name} className="border-b border-zinc-100 align-top">
              <td className="py-4 pr-4">
                <div className="flex items-center gap-2 font-semibold text-zinc-950">
                  {competitor.name}
                  {competitor.isVerified ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : null}
                </div>
                <a
                  href={competitor.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900"
                >
                  Website <ExternalLink className="h-3 w-3" />
                </a>
              </td>
              <td className="px-4 py-4 text-zinc-600">{competitor.description}</td>
              <td className="px-4 py-4">
                <div className="font-medium text-zinc-950">{competitor.pricing}</div>
                <div className="text-xs text-zinc-500">{competitor.pricingTier}</div>
              </td>
              <td className="px-4 py-4 text-zinc-600">{competitor.positioning}</td>
              <td className="px-4 py-4 text-zinc-600">{competitor.strengths.join(", ")}</td>
              <td className="px-4 py-4 text-zinc-600">{competitor.weaknesses.join(", ")}</td>
              <td className="px-4 py-4">
                <div className="mb-1 text-xs font-semibold text-zinc-700">
                  {Math.round(competitor.confidenceScore * 100)}%
                </div>
                <div className="h-2 w-20 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-teal-700"
                    style={{ width: `${competitor.confidenceScore * 100}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-zinc-500">
                  {competitor.evidence[0]?.kind ?? "inferred"}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
