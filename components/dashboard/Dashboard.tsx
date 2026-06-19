"use client";

import { useState } from "react";
import type { ElementType, ReactNode } from "react";
import type { AnalysisResult } from "@/lib/types";
import {
  ArrowLeft,
  Download,
  FileSearch,
  Lightbulb,
  Target,
  TriangleAlert,
  Users,
} from "lucide-react";
import ActionItems from "./ActionItems";
import CompetitorTable from "./CompetitorTable";
import FeatureMatrix from "./FeatureMatrix";
import LeadsTable from "./LeadsTable";
import MarketOverview from "./MarketOverview";
import PositioningMap from "./PositioningMap";
import PricingChart from "./PricingChart";
import RecommendationCards from "./RecommendationCards";

interface Props {
  result: AnalysisResult;
  onReset: () => void;
  onExport: () => Promise<void>;
}

const tabs = ["overview", "competitors", "leads", "recommendations"] as const;
type Tab = (typeof tabs)[number];

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: ElementType;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
      <Icon className="mb-4 h-5 w-5 text-teal-700" />
      <div className="text-2xl font-semibold text-zinc-950">{value}</div>
      <div className="text-sm text-zinc-500">{label}</div>
    </div>
  );
}

function Section({
  title,
  children,
  aside,
}: {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export default function Dashboard({ result, onReset, onExport }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const recommendationCount =
    result.productRecommendations.length +
    result.marketRecommendations.length +
    result.salesRecommendations.length;

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-zinc-950">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-teal-300 hover:bg-teal-50"
            >
              <ArrowLeft className="h-4 w-4" />
              New analysis
            </button>
            <div>
              <div className="text-sm font-semibold text-zinc-950">
                NexusIntel
              </div>
              <div className="text-xs text-zinc-500">
                Generated {new Date(result.generatedAt).toLocaleString()}
              </div>
            </div>
          </div>

          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-5 py-6 lg:px-8">
        <section className="rounded-md border border-teal-200 bg-teal-50 p-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-teal-900">
            <FileSearch className="h-4 w-4" />
            Market insight
          </div>
          <p className="max-w-5xl text-sm leading-6 text-teal-950">
            {result.marketInsight}
          </p>
        </section>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Competitors found" value={result.competitors.length} icon={Users} />
          <Stat label="Leads ranked" value={result.leads.length} icon={Target} />
          <Stat label="Recommendations" value={recommendationCount} icon={Lightbulb} />
          <Stat label="Market risks" value={result.risks.length} icon={TriangleAlert} />
        </div>

        <div className="flex flex-wrap gap-2 rounded-md border border-zinc-200 bg-white p-2 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-4 py-2 text-sm font-semibold capitalize transition ${
                activeTab === tab
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "overview" ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Section title="Actions to take today">
              <ActionItems actions={result.actionItems} />
            </Section>
            <Section title="Market landscape">
              <MarketOverview items={result.marketLandscape} />
            </Section>
            <Section
              title="Positioning map"
              aside={<span className="text-xs text-zinc-500">Price vs feature depth</span>}
            >
              <PositioningMap data={result.positioningData} />
            </Section>
            <Section title="Pricing comparison">
              <PricingChart competitors={result.competitors} />
            </Section>
            <Section title="Top risks">
              <div className="space-y-3">
                {result.risks.map((risk, index) => (
                  <div
                    key={`risk-${index}`}
                    className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
                  >
                    {risk}
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Assumptions and reliability">
              <div className="space-y-3">
                {result.assumptions.map((assumption) => (
                  <div
                    key={assumption}
                    className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700"
                  >
                    {assumption}
                  </div>
                ))}
              </div>
            </Section>
          </div>
        ) : null}

        {activeTab === "competitors" ? (
          <div className="space-y-5">
            <Section title="Side-by-side competitor table">
              <p className="mb-4 text-sm leading-6 text-zinc-600">
                {result.productSummary}
              </p>
              <CompetitorTable competitors={result.competitors} />
            </Section>
            <Section title="Feature comparison matrix">
              <FeatureMatrix
                features={result.featureComparison}
                competitors={result.competitors}
              />
            </Section>
          </div>
        ) : null}

        {activeTab === "leads" ? (
          <Section
            title="Lead generation shortlist"
            aside={<span className="text-xs text-zinc-500">{result.targetAudience}</span>}
          >
            <LeadsTable leads={result.leads} />
          </Section>
        ) : null}

        {activeTab === "recommendations" ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Section title="Product recommendations">
              <RecommendationCards recommendations={result.productRecommendations} />
            </Section>
            <Section title="Market recommendations">
              <RecommendationCards recommendations={result.marketRecommendations} />
            </Section>
            <Section title="Sales recommendations">
              <RecommendationCards recommendations={result.salesRecommendations} />
            </Section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
