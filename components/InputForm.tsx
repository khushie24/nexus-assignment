"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { AnalysisInput } from "@/lib/types";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe,
  LineChart,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

interface Props {
  onSubmit: (input: AnalysisInput) => void;
  loading: boolean;
}

const examples = [
  "AI competitive intelligence and lead generation platform for startup founders",
  "No-code workflow automation tool for boutique agencies",
  "Invoice automation software for freelancers and small finance teams",
];

export default function InputForm({ onSubmit, loading }: Props) {
  const [productDescription, setProductDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [companyName, setCompanyName] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (productDescription.trim().length < 10) {
      return;
    }

    onSubmit({
      productDescription: productDescription.trim(),
      websiteUrl: websiteUrl.trim() || undefined,
      companyName: companyName.trim() || undefined,
    });
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-zinc-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-10 px-5 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800">
            <ShieldCheck className="h-4 w-4" />
            Evidence-aware startup intelligence
          </div>

          <div className="space-y-5">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl">
              NexusIntel turns market noise into founder decisions.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-zinc-600">
              Enter a product idea, website, or company name. Get competitors,
              feature gaps, pricing signals, prioritized leads, and clear next
              actions with confidence labels.
            </p>
          </div>

          <div className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: "Competitors", value: "5+", icon: LineChart },
              { label: "Lead prospects", value: "8+", icon: Users },
              { label: "Actions", value: "15", icon: CheckCircle2 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm"
                >
                  <Icon className="mb-3 h-5 w-5 text-teal-700" />
                  <div className="text-2xl font-semibold">{item.value}</div>
                  <div className="text-sm text-zinc-500">{item.label}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-200/70 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-800">
                <Search className="h-4 w-4 text-teal-700" />
                Product, startup idea, or business description
              </label>
              <textarea
                value={productDescription}
                onChange={(event) => setProductDescription(event.target.value)}
                placeholder="Example: AI tool that helps founders analyze competitors, find feature gaps, and identify sales leads."
                rows={6}
                maxLength={2000}
                disabled={loading}
                className="w-full resize-none rounded-md border border-zinc-300 bg-zinc-50 px-4 py-3 text-base outline-none transition focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                <span>
                  {productDescription.length > 0 &&
                  productDescription.trim().length < 10
                    ? "Add a little more detail to run analysis."
                    : "The more specific you are, the sharper the output."}
                </span>
                <span>{productDescription.length}/2000</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-800">
                  <Globe className="h-4 w-4 text-teal-700" />
                  Website URL
                </label>
                <input
                  value={websiteUrl}
                  onChange={(event) => setWebsiteUrl(event.target.value)}
                  placeholder="https://example.com"
                  disabled={loading}
                  className="w-full rounded-md border border-zinc-300 bg-zinc-50 px-4 py-3 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-800">
                  <Building2 className="h-4 w-4 text-teal-700" />
                  Company name
                </label>
                <input
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder="NexusIntel"
                  disabled={loading}
                  className="w-full rounded-md border border-zinc-300 bg-zinc-50 px-4 py-3 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-zinc-700">Try a sample</p>
              <div className="flex flex-wrap gap-2">
                {examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setProductDescription(example)}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-700 transition hover:border-teal-300 hover:bg-teal-50"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || productDescription.trim().length < 10}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-5 py-4 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              Run competitor and lead analysis
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
