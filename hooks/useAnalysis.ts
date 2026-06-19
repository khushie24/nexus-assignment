import { useState } from "react";
import type { AnalysisResult, AnalysisInput, ApiError } from "@/lib/types";

interface UseAnalysisReturn {
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  progress: number;
  analyze: (input: AnalysisInput) => Promise<void>;
  reset: () => void;
  exportCsv: () => Promise<void>;
}

export function useAnalysis(): UseAnalysisReturn {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const analyze = async (input: AnalysisInput) => {
    setLoading(true);
    setError(null);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 8, 85));
    }, 1200);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = (await res.json()) as AnalysisResult | ApiError;

      if (!res.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Analysis failed");
      }

      setProgress(100);
      setResult(data as AnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setProgress(0);
  };

  const exportCsv = async () => {
    if (!result) return;
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nexus-intel-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      console.error("Export failed");
    }
  };

  return { result, loading, error, progress, analyze, reset, exportCsv };
}