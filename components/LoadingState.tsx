"use client";

import { useMemo } from "react";
import { CheckCircle2, CircleDashed } from "lucide-react";

interface Props {
  progress: number;
}

const steps = [
  { label: "Reading product context", threshold: 0 },
  { label: "Finding competitor signals", threshold: 20 },
  { label: "Comparing features and pricing", threshold: 40 },
  { label: "Ranking leads and decision makers", threshold: 60 },
  { label: "Writing recommendations", threshold: 78 },
  { label: "Preparing dashboard", threshold: 92 },
];

export default function LoadingState({ progress }: Props) {
  const currentStep = useMemo(() => {
    let index = 0;
    steps.forEach((step, stepIndex) => {
      if (progress >= step.threshold) {
        index = stepIndex;
      }
    });
    return index;
  }, [progress]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f6f2] px-5 text-zinc-950">
      <div className="w-full max-w-xl rounded-lg border border-zinc-200 bg-white p-7 shadow-xl shadow-zinc-200/70">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Building your report</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {steps[currentStep]?.label}
            </p>
          </div>
          <div className="text-3xl font-semibold text-teal-700">
            {Math.round(progress)}%
          </div>
        </div>

        <div className="mb-6 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-teal-700 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const complete = index < currentStep;
            const active = index === currentStep;
            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm ${
                  active
                    ? "border-teal-200 bg-teal-50 text-teal-900"
                    : complete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-zinc-200 bg-zinc-50 text-zinc-500"
                }`}
              >
                {complete ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <CircleDashed className={`h-4 w-4 ${active ? "animate-spin" : ""}`} />
                )}
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
