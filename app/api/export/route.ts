import { NextResponse } from "next/server";
import type { AnalysisResult } from "@/lib/types";

function csvCell(value: unknown) {
  const text = Array.isArray(value) ? value.join("; ") : String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function POST(req: Request) {
  try {
    const data = (await req.json()) as AnalysisResult;
    const rows: string[][] = [];

    rows.push(["NexusIntel Competitor Analysis Report"]);
    rows.push(["Generated", new Date(data.generatedAt).toLocaleString()]);
    rows.push(["Product", data.input?.productDescription ?? data.productSummary]);
    rows.push([]);

    rows.push(["Competitors"]);
    rows.push([
      "Name",
      "Website",
      "Pricing",
      "Threat Level",
      "Confidence",
      "Positioning",
      "Strengths",
      "Weaknesses",
      "Evidence",
    ]);
    data.competitors.forEach((competitor) => {
      rows.push([
        competitor.name,
        competitor.website,
        competitor.pricing,
        competitor.threatLevel,
        `${Math.round(competitor.confidenceScore * 100)}%`,
        competitor.positioning,
        competitor.strengths.join("; "),
        competitor.weaknesses.join("; "),
        competitor.evidence.map((item) => item.url ?? item.label).join("; "),
      ]);
    });

    rows.push([]);
    rows.push(["Leads"]);
    rows.push([
      "Company",
      "Website",
      "Industry",
      "Size",
      "Location",
      "Contact",
      "Title",
      "Email",
      "Priority",
      "Reason",
    ]);
    data.leads.forEach((lead) => {
      rows.push([
        lead.companyName,
        lead.website,
        lead.industry,
        lead.employeeSize,
        lead.location,
        lead.contactPerson,
        lead.jobTitle,
        lead.businessEmail ?? "",
        `${lead.priorityScore}/10`,
        lead.relevanceReason,
      ]);
    });

    rows.push([]);
    rows.push(["Recommendations"]);
    rows.push(["Type", "Title", "Priority", "Impact", "Effort", "Timeframe", "Reasoning"]);
    [
      ...data.productRecommendations.map((item) => ["Product", item] as const),
      ...data.marketRecommendations.map((item) => ["Market", item] as const),
      ...data.salesRecommendations.map((item) => ["Sales", item] as const),
    ].forEach(([type, item]) => {
      rows.push([
        type,
        item.title,
        item.priority,
        item.impact,
        item.effort,
        item.timeframe,
        item.reasoning,
      ]);
    });

    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nexus-intel-report-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed." },
      { status: 500 }
    );
  }
}
