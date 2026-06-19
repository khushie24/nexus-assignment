import { NextResponse } from "next/server";
import { runFallbackAnalysis } from "@/lib/analyzer";
import type { AnalysisInput } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const input = (await req.json()) as AnalysisInput;
    const result = runFallbackAnalysis(input);

    return NextResponse.json({
      competitors: result.competitors,
      featureComparison: result.featureComparison,
      positioningData: result.positioningData,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Competitor analysis failed." },
      { status: 400 }
    );
  }
}
