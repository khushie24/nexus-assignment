"use client";

import Dashboard from "@/components/dashboard/Dashboard";
import InputForm from "@/components/InputForm";
import LoadingState from "@/components/LoadingState";
import { useAnalysis } from "@/hooks/useAnalysis";
import { AlertCircle } from "lucide-react";

export default function Home() {
  const { result, loading, error, progress, analyze, reset, exportCsv } =
    useAnalysis();

  if (loading) {
    return <LoadingState progress={progress} />;
  }

  if (result) {
    return <Dashboard result={result} onReset={reset} onExport={exportCsv} />;
  }

  return (
    <main>
      {error ? (
        <div className="fixed right-4 top-4 z-50 flex max-w-sm items-start gap-2 rounded-md border border-red-200 bg-white px-4 py-3 text-sm text-red-700 shadow-lg">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
      <InputForm onSubmit={analyze} loading={loading} />
    </main>
  );
}
