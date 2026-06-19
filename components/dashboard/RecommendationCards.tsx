"use client";

import type { Recommendation } from "@/lib/types";
import { Clock, Gauge, TrendingUp } from "lucide-react";

interface Props {
  recommendations: Recommendation[];
}

export default function RecommendationCards({ recommendations }: Props) {
  return (
    <div className="space-y-3">
      {recommendations.map((recommendation) => (
        <article
          key={recommendation.title}
          className="rounded-md border border-zinc-200 bg-zinc-50 p-4"
        >
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-semibold text-zinc-950">{recommendation.title}</h3>
            <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-zinc-600">
              {recommendation.priority}
            </span>
          </div>
          <p className="text-sm leading-6 text-zinc-600">{recommendation.description}</p>
          <p className="mt-3 border-l-2 border-teal-700 pl-3 text-sm leading-6 text-zinc-700">
            {recommendation.reasoning}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              {recommendation.impact}
            </span>
            <span className="inline-flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" />
              {recommendation.effort}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {recommendation.timeframe}
            </span>
          </div>
          <div className="mt-3 text-xs text-zinc-500">
            {Math.round(recommendation.confidenceScore * 100)}% confidence /
            {` ${recommendation.evidence[0]?.kind ?? "inferred"}`}
          </div>
        </article>
      ))}
    </div>
  );
}
