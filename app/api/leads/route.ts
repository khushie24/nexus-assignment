import { NextResponse } from "next/server";
import { runFallbackAnalysis } from "@/lib/analyzer";
import type { AnalysisInput } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const input = (await req.json()) as AnalysisInput;
    const result = runFallbackAnalysis(input);

    return NextResponse.json({
      targetAudience: result.targetAudience,
      leads: result.leads,
      salesRecommendations: result.salesRecommendations,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lead generation failed." },
      { status: 400 }
    );
  }
}
