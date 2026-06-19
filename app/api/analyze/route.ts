import { NextResponse } from "next/server";
import { runFullAnalysis, runFallbackAnalysis } from "@/lib/analyzer";
import type { AnalysisInput, ApiError } from "@/lib/types";

export const maxDuration = 60;
export const runtime = "nodejs";

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return undefined;
  }

  return value.replace(/[<>]/g, "").slice(0, maxLength).trim() || undefined;
}

function sanitizeInput(input: unknown): AnalysisInput {
  if (typeof input !== "object" || input === null) {
    throw new Error("Request body must be a JSON object.");
  }

  const raw = input as Record<string, unknown>;
  const productDescription = cleanText(raw.productDescription, 2000);

  if (!productDescription || productDescription.length < 10) {
    throw new Error("Product description must be at least 10 characters.");
  }

  const websiteUrl = cleanText(raw.websiteUrl, 500);
  const companyName = cleanText(raw.companyName, 160);

  if (websiteUrl) {
    try {
      const url = new URL(
        websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`
      );

      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Unsupported protocol.");
      }
    } catch {
      throw new Error("Website URL is invalid.");
    }
  }

  return { productDescription, websiteUrl, companyName };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = sanitizeInput(body);

    let result;
    try {
      result = await runFullAnalysis(input);
    } catch (error) {
      console.error("Live analysis failed, using fallback engine:", error);
      result = runFallbackAnalysis(input);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);

    const response: ApiError = {
      error: error instanceof Error ? error.message : "Analysis failed.",
      details:
        "Try a clearer product description, or remove optional fields and run the analysis again.",
    };

    return NextResponse.json(response, { status: 400 });
  }
}
