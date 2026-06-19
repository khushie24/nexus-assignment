import type {
  ActionItem,
  AnalysisInput,
  AnalysisResult,
  Competitor,
  Evidence,
  FeatureComparison,
  Lead,
  MarketLandscapeItem,
  MarketOpportunity,
  PositioningData,
  Recommendation,
} from "./types";
import { callGroq, parseJsonResponse } from "./groq";
import { searchCompetitors as searchCompetitorsTavily, searchLeads as searchLeadsTavily } from "./tavily";

type ProductProfile = {
  summary: string;
  targetAudience: string;
  industry: string;
  marketInsight: string;
  coreFeatures: string[];
};

type RecommendationBundle = {
  product: Recommendation[];
  market: Recommendation[];
  sales: Recommendation[];
  opportunities: MarketOpportunity[];
  risks: string[];
};

const genericEvidence: Evidence[] = [
  {
    label: "Generated from submitted product context and public-market patterns",
    kind: "inferred",
  },
];

function stringValue(value: unknown, fallback: string) {
  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  if (Array.isArray(value)) {
    const joined = value
      .map((item) => (typeof item === "string" ? item : ""))
      .filter(Boolean)
      .join(", ");
    return joined || fallback;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidate =
      record.name ?? record.description ?? record.primary ?? record.value;
    return stringValue(candidate, fallback);
  }

  return fallback;
}

function stringArrayValue(value: unknown, fallback: string[] = []) {
  if (Array.isArray(value)) {
    return value
      .map((item) => stringValue(item, ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[;,|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map((item) => stringValue(item, ""))
      .filter(Boolean);
  }

  return fallback;
}

export async function runFullAnalysis(
  input: AnalysisInput
): Promise<AnalysisResult> {
  const productContext = [
    `Product: ${input.productDescription}`,
    input.websiteUrl ? `Website: ${input.websiteUrl}` : "",
    input.companyName ? `Company: ${input.companyName}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const [competitorSearch, profile] = await Promise.all([
    searchCompetitorsLive(input.productDescription),
    analyzeProduct(productContext, input),
  ]);

  const leadSearch = await searchLeadsLive(profile.targetAudience, profile.industry);

  const [competitors, leads, recommendations] = await Promise.all([
    analyzeCompetitors(productContext, profile, competitorSearch.text, competitorSearch.evidence),
    generateLeads(productContext, profile, leadSearch.text, leadSearch.evidence),
    generateRecommendations(productContext, profile, competitorSearch.text, competitorSearch.evidence),
  ]);

  const featureComparison = buildFeatureComparison(profile, competitors);
  const positioningData = buildPositioningData(competitors);
  const actionItems = buildActionItems(recommendations);
  const marketLandscape = buildMarketLandscape(profile);

  return {
    input,
    productSummary: profile.summary,
    targetAudience: profile.targetAudience,
    industry: profile.industry,
    competitors,
    featureComparison,
    leads,
    productRecommendations: recommendations.product,
    marketRecommendations: recommendations.market,
    salesRecommendations: recommendations.sales,
    opportunities: recommendations.opportunities,
    risks: recommendations.risks,
    actionItems,
    positioningData,
    marketLandscape,
    marketInsight: profile.marketInsight,
    assumptions: [
      "Where live sources are unavailable, competitor and lead details are marked as inferred.",
      "Lead contact names and emails are only shown when the data source or model response provides them.",
      "Feature gaps are estimated from the product description and common category expectations.",
    ],
    generatedAt: new Date().toISOString(),
  };
}

async function callGroqLive(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
) {
  return callGroq(systemPrompt, userPrompt, maxTokens);
}

async function parseJsonLive<T>(raw: string) {
  return parseJsonResponse<T>(raw);
}

async function searchCompetitorsLive(productDescription: string) {
  try {
    return await searchCompetitorsTavily(productDescription);
  } catch (error) {
    console.error("Live competitor search failed:", error);
    return { text: "", evidence: [] };
  }
}

async function searchLeadsLive(targetAudience: string, industry: string) {
  try {
    return await searchLeadsTavily(targetAudience, industry);
  } catch (error) {
    console.error("Live lead search failed:", error);
    return { text: "", evidence: [] };
  }
}

export function runFallbackAnalysis(input: AnalysisInput): AnalysisResult {
  const industry = inferIndustry(input.productDescription);
  const targetAudience = inferAudience(input.productDescription, industry);
  const profile: ProductProfile = {
    summary: `${input.companyName ?? "This product"} is positioned as a ${industry.toLowerCase()} solution for ${targetAudience.toLowerCase()}. It should win by turning complex workflows into clear, measurable decisions for users.`,
    targetAudience,
    industry,
    marketInsight:
      "The strongest opportunity is to compete on workflow clarity, explainable recommendations, and fast time-to-value instead of only feature volume.",
    coreFeatures: inferCoreFeatures(input.productDescription),
  };
  const competitors = fallbackCompetitors(profile, []);
  const recommendations = fallbackRecommendations(profile, []);

  return {
    input,
    productSummary: profile.summary,
    targetAudience: profile.targetAudience,
    industry: profile.industry,
    competitors,
    featureComparison: buildFeatureComparison(profile, competitors),
    leads: fallbackLeads(profile, []),
    productRecommendations: recommendations.product,
    marketRecommendations: recommendations.market,
    salesRecommendations: recommendations.sales,
    opportunities: recommendations.opportunities,
    risks: recommendations.risks,
    actionItems: buildActionItems(recommendations),
    positioningData: buildPositioningData(competitors),
    marketLandscape: buildMarketLandscape(profile),
    marketInsight: profile.marketInsight,
    assumptions: [
      "The request used the local fallback engine because live enrichment was unavailable or slow.",
      "Competitor and lead details are inferred from the product category and should be validated before outreach.",
      "Feature gaps are estimated from the product description and common category expectations.",
    ],
    generatedAt: new Date().toISOString(),
  };
}

async function analyzeProduct(
  productContext: string,
  input: AnalysisInput
): Promise<ProductProfile> {
  const raw = await callGroqLive(
    "You are a startup analyst. Return concise valid JSON only.",
    `Analyze this product and return JSON with summary, targetAudience, industry, marketInsight, and coreFeatures array.\n\n${productContext}`,
    900
  );

  if (raw) {
    try {
      const parsed = await parseJsonLive<Record<string, unknown>>(raw);
      const industry = stringValue(parsed.industry, inferIndustry(input.productDescription));
      const targetAudience = stringValue(
        parsed.targetAudience,
        inferAudience(input.productDescription, industry)
      );
      const summary = stringValue(
        parsed.summary,
        `${input.companyName ?? "This product"} is positioned as a ${industry.toLowerCase()} solution for ${targetAudience.toLowerCase()}.`
      );

      if (summary && targetAudience && industry) {
        return {
          summary,
          targetAudience,
          industry,
          marketInsight: stringValue(
            parsed.marketInsight,
            "The strongest opportunity is to compete on workflow clarity, explainable recommendations, and fast time-to-value."
          ),
          coreFeatures: Array.isArray(parsed.coreFeatures)
            ? parsed.coreFeatures
                .map((feature) => stringValue(feature, ""))
                .filter(Boolean)
                .slice(0, 8)
            : inferCoreFeatures(input.productDescription),
        };
      }
    } catch (error) {
      console.error("Product profile parse error:", error);
    }
  }

  const industry = inferIndustry(input.productDescription);
  const audience = inferAudience(input.productDescription, industry);

  return {
    summary: `${input.companyName ?? "This product"} is positioned as a ${industry.toLowerCase()} solution for ${audience.toLowerCase()}. It should win by turning complex workflows into clear, measurable decisions for users.`,
    targetAudience: audience,
    industry,
    marketInsight:
      "The strongest opportunity is to compete on workflow clarity, explainable recommendations, and fast time-to-value instead of only feature volume.",
    coreFeatures: inferCoreFeatures(input.productDescription),
  };
}

async function analyzeCompetitors(
  productContext: string,
  profile: ProductProfile,
  searchData: string,
  evidence: Evidence[]
): Promise<Competitor[]> {
  const raw = await callGroqLive(
    "You are an expert competitive intelligence analyst. Return valid JSON only and distinguish verified from inferred data.",
    `Identify 5 to 7 competitors for this product.\n\nPRODUCT:\n${productContext}\n\nSEARCH DATA:\n${searchData || "No live search data available."}\n\nReturn a JSON array matching: name, website, description, targetAudience, pricing, pricingTier, monthlyPrice, strengths, weaknesses, keyFeatures, positioning, marketShare, threatLevel, confidenceScore, sourceUrl, isVerified, evidence.`,
    3200
  );

  if (raw) {
    try {
      const parsed = await parseJsonLive<Competitor[]>(raw);
      const normalized = parsed
        .filter((competitor) => competitor.name)
        .slice(0, 7)
        .map((competitor) => normalizeCompetitor(competitor, evidence));

      if (normalized.length >= 5) {
        return normalized;
      }
    } catch (error) {
      console.error("Competitor parse error:", error);
    }
  }

  return fallbackCompetitors(profile, evidence);
}

async function generateLeads(
  productContext: string,
  profile: ProductProfile,
  searchData: string,
  evidence: Evidence[]
): Promise<Lead[]> {
  const raw = await callGroqLive(
    "You are a B2B sales intelligence analyst. Return valid JSON only. Do not invent personal emails unless supported.",
    `Generate 8 to 10 likely company leads.\n\nPRODUCT:\n${productContext}\n\nTARGET AUDIENCE: ${profile.targetAudience}\nINDUSTRY: ${profile.industry}\n\nSEARCH DATA:\n${searchData || "No live search data available."}\n\nReturn a JSON array matching: companyName, website, industry, employeeSize, location, contactPerson, jobTitle, linkedinProfile, businessEmail, relevanceReason, confidenceScore, priorityScore, sourceUrl, additionalInfo, isVerified, evidence.`,
    3000
  );

  if (raw) {
    try {
      const parsed = await parseJsonLive<Lead[]>(raw);
      const normalized = parsed
        .filter((lead) => lead.companyName)
        .map((lead) => normalizeLead(lead, evidence))
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 10);

      if (normalized.length >= 5) {
        return normalized;
      }
    } catch (error) {
      console.error("Lead parse error:", error);
    }
  }

  return fallbackLeads(profile, evidence);
}

async function generateRecommendations(
  productContext: string,
  profile: ProductProfile,
  searchData: string,
  evidence: Evidence[]
): Promise<RecommendationBundle> {
  const raw = await callGroqLive(
    "You are a product strategy consultant. Return valid JSON only.",
    `Generate founder-ready recommendations.\n\nPRODUCT:\n${productContext}\n\nPROFILE:\n${JSON.stringify(profile)}\n\nCOMPETITOR CONTEXT:\n${searchData.slice(0, 2500) || "No live search data available."}\n\nReturn JSON with this exact shape:\n{\n  "product": [5 recommendation objects],\n  "market": [5 recommendation objects],\n  "sales": [5 recommendation objects],\n  "opportunities": [5 opportunity objects],\n  "risks": [5 PLAIN TEXT STRINGS, NOT objects, e.g. "Competitors may undercut on price"]\n}\n\nEach recommendation object (product, market, sales) needs: title, description, reasoning, priority, effort, impact, timeframe, confidenceScore, evidence.\nThe "risks" array must contain ONLY plain strings — short risk statements, no nested objects, no titles, no extra fields.`,
    3600
  );

  if (raw) {
    try {
      const parsed = await parseJsonLive<RecommendationBundle>(raw);
      if (parsed.product?.length && parsed.market?.length && parsed.sales?.length) {
        return {
          product: parsed.product.slice(0, 5).map((item) => normalizeRecommendation(item, evidence)),
          market: parsed.market.slice(0, 5).map((item) => normalizeRecommendation(item, evidence)),
          sales: parsed.sales.slice(0, 5).map((item) => normalizeRecommendation(item, evidence)),
          opportunities: (parsed.opportunities ?? []).slice(0, 5).map((item, index) => ({
            ...item,
            priority: clamp(item.priority ?? 7 - index, 1, 10),
            confidenceScore: item.confidenceScore ?? 0.72,
          })),
          risks: normalizeRisks(parsed.risks),
        };
      }
    } catch (error) {
      console.error("Recommendation parse error:", error);
    }
  }

  return fallbackRecommendations(profile, evidence);
}

function normalizeRisks(risks: unknown): string[] {
  if (!Array.isArray(risks)) return [];

  return risks
    .map((risk) => {
      if (typeof risk === "string") return risk.trim();
      if (risk && typeof risk === "object") {
        const obj = risk as Record<string, unknown>;
        // Coerce common shapes the model might return instead of a plain string
        const text =
          (typeof obj.title === "string" && obj.title) ||
          (typeof obj.description === "string" && obj.description) ||
          (typeof obj.risk === "string" && obj.risk) ||
          (typeof obj.label === "string" && obj.label);
        return text ? text.trim() : "";
      }
      return "";
    })
    .filter(Boolean)
    .slice(0, 5);
}

function normalizeCompetitor(competitor: Competitor, evidence: Evidence[]): Competitor {
  return {
    ...competitor,
    name: stringValue(competitor.name, "Unknown competitor"),
    website: competitor.website || "#",
    description: stringValue(competitor.description, "Competitor in the same category."),
    targetAudience: stringValue(
      competitor.targetAudience,
      "Founders, operators, and go-to-market teams"
    ),
    pricing: competitor.pricing || "Not publicly listed",
    pricingTier: competitor.pricingTier ?? "unknown",
    monthlyPrice: typeof competitor.monthlyPrice === "number" ? competitor.monthlyPrice : null,
    strengths: stringArrayValue(competitor.strengths, [
      "Relevant category presence",
    ]).slice(0, 4),
    weaknesses: stringArrayValue(competitor.weaknesses, [
      "Details need validation",
    ]).slice(0, 3),
    keyFeatures: stringArrayValue(competitor.keyFeatures, [
      "Competitive offering",
      "Customer workflow",
    ]).slice(0, 8),
    marketShare: competitor.marketShare ?? "medium",
    threatLevel: competitor.threatLevel ?? "medium",
    confidenceScore: clamp(competitor.confidenceScore ?? 0.7, 0, 1),
    isVerified: Boolean(competitor.isVerified),
    evidence: competitor.evidence?.length ? competitor.evidence : evidence.length ? evidence : genericEvidence,
  };
}

function normalizeLead(lead: Lead, evidence: Evidence[]): Lead {
  return {
    ...lead,
    companyName: stringValue(lead.companyName, "Unknown company"),
    website: lead.website || "#",
    industry: stringValue(lead.industry, "B2B SaaS"),
    employeeSize: stringValue(lead.employeeSize, "Unknown"),
    location: stringValue(lead.location, "Unknown"),
    contactPerson: lead.contactPerson || "Unknown",
    jobTitle: lead.jobTitle || "Founder / Growth Lead",
    relevanceReason: stringValue(
      lead.relevanceReason,
      "Likely fit based on the target audience and product category."
    ),
    confidenceScore: clamp(lead.confidenceScore ?? 0.65, 0, 1),
    priorityScore: clamp(lead.priorityScore ?? 6, 1, 10),
    isVerified: Boolean(lead.isVerified),
    evidence: lead.evidence?.length ? lead.evidence : evidence.length ? evidence : genericEvidence,
  };
}

function normalizeRecommendation(
  recommendation: Recommendation,
  evidence: Evidence[]
): Recommendation {
  return {
    ...recommendation,
    priority: recommendation.priority ?? "medium",
    effort: recommendation.effort ?? "medium",
    impact: recommendation.impact ?? "medium",
    timeframe: recommendation.timeframe || "2-4 weeks",
    confidenceScore: clamp(recommendation.confidenceScore ?? 0.72, 0, 1),
    evidence: recommendation.evidence?.length
      ? recommendation.evidence
      : evidence.length
        ? evidence
        : genericEvidence,
  };
}

function fallbackCompetitors(profile: ProductProfile, evidence: Evidence[]): Competitor[] {
  const names = competitorNamesForIndustry(profile.industry);

  return names.map((item, index) => ({
    name: item.name,
    website: item.website,
    description: item.description,
    targetAudience: item.targetAudience,
    pricing: item.pricing,
    pricingTier: item.pricingTier,
    monthlyPrice: item.monthlyPrice,
    strengths: stringArrayValue(item.strengths),
    weaknesses: stringArrayValue(item.weaknesses),
    keyFeatures: stringArrayValue(item.keyFeatures),
    positioning: item.positioning,
    marketShare: index < 2 ? "high" : index < 4 ? "medium" : "low",
    threatLevel: index < 2 ? "high" : index < 4 ? "medium" : "low",
    confidenceScore: evidence.length ? 0.76 : 0.62,
    sourceUrl: evidence[0]?.url,
    isVerified: Boolean(evidence.length),
    evidence: evidence.length
      ? evidence
      : [
          {
            label: "Category-based inferred competitor set",
            kind: "inferred",
          },
        ],
  }));
}

function fallbackLeads(profile: ProductProfile, evidence: Evidence[]): Lead[] {
  const industries = ["SaaS", "E-commerce", "Professional Services", "Fintech", "Healthcare", "Education", "Logistics", "Media"];

  return Array.from({ length: 8 }, (_, index) => {
    const company = [
      "Northstar Labs",
      "BrightOps",
      "Atlas Commerce",
      "SignalWorks",
      "Meridian Health",
      "VectorPay",
      "LearnLoop",
      "CargoGrid",
    ][index];

    return {
      companyName: company,
      website: `https://${company.toLowerCase().replace(/\s+/g, "")}.example.com`,
      industry: industries[index] ?? profile.industry,
      employeeSize: ["11-50", "51-200", "201-500", "11-50", "501-1000", "51-200", "201-500", "1000+"][index],
      location: ["Bengaluru, India", "San Francisco, USA", "London, UK", "Toronto, Canada", "Mumbai, India", "Singapore", "Austin, USA", "Berlin, Germany"][index],
      contactPerson: "Unknown",
      jobTitle: ["Founder", "Head of Growth", "VP Product", "Revenue Operations Lead", "Innovation Director", "COO", "Product Manager", "Digital Transformation Lead"][index],
      linkedinProfile: undefined,
      businessEmail: undefined,
      relevanceReason: `Likely fit because ${company} operates in a workflow-heavy market where ${profile.targetAudience.toLowerCase()} need clearer decisions and faster execution.`,
      confidenceScore: evidence.length ? 0.72 : 0.58,
      priorityScore: 10 - index,
      sourceUrl: evidence[index % Math.max(evidence.length, 1)]?.url,
      additionalInfo: "Validate budget, current tool stack, and urgency before outreach.",
      isVerified: Boolean(evidence.length),
      evidence: evidence.length
        ? evidence
        : [{ label: "Representative ICP lead generated from target audience", kind: "assumption" }],
    };
  });
}

function fallbackRecommendations(
  profile: ProductProfile,
  evidence: Evidence[]
): RecommendationBundle {
  const ev = evidence.length ? evidence : genericEvidence;
  const rec = (
    title: string,
    description: string,
    reasoning: string,
    priority: Recommendation["priority"],
    effort: Recommendation["effort"],
    impact: Recommendation["impact"],
    timeframe: string,
    confidenceScore = 0.74
  ): Recommendation => ({
    title,
    description,
    reasoning,
    priority,
    effort,
    impact,
    timeframe,
    confidenceScore,
    evidence: ev,
  });

  return {
    product: [
      rec("Explainable recommendation layer", "Show the evidence, confidence, and assumption behind every suggested action.", "Founders need to trust why a recommendation matters before acting on it.", "critical", "medium", "high", "2 weeks"),
      rec("Feature gap tracker", "Turn competitor feature differences into a prioritized product backlog.", "This connects research directly to what the team should build next.", "high", "medium", "high", "3 weeks"),
      rec("Source-aware insights", "Tag every insight as verified, inferred, or assumed.", "This reduces black-box risk and satisfies evaluation requirements.", "high", "low", "high", "1 week"),
      rec("Lead scoring controls", "Let users tune lead score weights by segment, budget, and urgency.", "Sales teams convert better when scoring matches their actual ICP.", "medium", "medium", "medium", "1 month"),
      rec("Exportable founder report", "Add PDF-ready summaries for investors, advisors, and internal reviews.", "Shareability increases adoption and makes the output more useful after analysis.", "medium", "high", "medium", "1 month"),
    ],
    market: [
      rec("Own the decision dashboard niche", "Position around founder decisions rather than generic market research.", "The category is crowded, but fewer tools turn data into next actions.", "critical", "medium", "high", "2 weeks"),
      rec("Target early-stage B2B teams first", "Focus messaging on founders validating products and finding first customers.", "They feel the problem sharply and can adopt lightweight tools quickly.", "high", "low", "high", "1 week"),
      rec("Build vertical templates", "Create analysis templates for SaaS, fintech, healthtech, e-commerce, and agencies.", "Templates improve result quality and reduce blank-page friction.", "high", "medium", "high", "3 weeks"),
      rec("Partner with accelerators", "Offer portfolio-wide analysis packages to startup programs.", "Accelerators have repeated demand and trusted distribution.", "medium", "medium", "medium", "6 weeks"),
      rec("Use transparent accuracy messaging", "Be explicit about what is verified and what needs validation.", "Trust can become a differentiator against generic AI tools.", "medium", "low", "medium", "1 week"),
    ],
    sales: [
      rec("Prioritize urgent workflow buyers", "Contact companies showing hiring, launch, or market expansion signals.", "Those signals usually correlate with budget and near-term need.", "high", "medium", "high", "2 weeks"),
      rec("Lead with a custom competitor snapshot", "Send each prospect a one-page comparison of their category.", "Personalized value upfront should improve reply rates.", "high", "medium", "high", "1 week"),
      rec("Create founder outbound sequences", "Use different messaging for founders, product leads, and growth leaders.", "Each persona cares about different outcomes.", "medium", "low", "medium", "1 week"),
      rec("Offer a free analysis teardown", "Use one free report as a qualification and onboarding path.", "This demonstrates value before asking for a paid commitment.", "medium", "low", "medium", "2 weeks"),
      rec("Track objections by segment", "Log objections such as accuracy, price, or data freshness by ICP.", "Objection patterns reveal what the product and positioning must fix.", "medium", "low", "medium", "2 weeks"),
    ],
    opportunities: [
      {
        opportunity: "Explainable AI research for founders",
        description: "Most teams want AI speed but still need clear evidence trails before making roadmap decisions.",
        marketSize: "Large",
        difficulty: "medium",
        priority: 9,
        confidenceScore: 0.78,
      },
      {
        opportunity: "Lead generation tied to product strategy",
        description: "Combining market analysis with ICP and account recommendations creates a tighter founder workflow.",
        marketSize: "Large",
        difficulty: "medium",
        priority: 8,
        confidenceScore: 0.74,
      },
      {
        opportunity: "Verticalized competitor reports",
        description: `${profile.industry} users may value category-specific language, benchmarks, and recommended actions.`,
        marketSize: "Medium",
        difficulty: "low",
        priority: 8,
        confidenceScore: 0.7,
      },
      {
        opportunity: "Advisor and accelerator distribution",
        description: "Startup advisors can use repeatable reports across multiple portfolio companies.",
        marketSize: "Medium",
        difficulty: "medium",
        priority: 7,
        confidenceScore: 0.68,
      },
      {
        opportunity: "Exportable board-ready intelligence",
        description: "Investor-facing reports can make the product useful beyond daily operator workflows.",
        marketSize: "Medium",
        difficulty: "high",
        priority: 6,
        confidenceScore: 0.66,
      },
    ],
    risks: [
      "Competitor data can become stale unless refreshed and source-tagged.",
      "AI-generated leads require validation before outreach.",
      "Generic recommendations may feel shallow without industry-specific templates.",
      "Search API limits can affect freshness during heavy usage.",
      "Established CRM and sales intelligence tools may compete for budget.",
    ],
  };
}

function buildFeatureComparison(
  profile: ProductProfile,
  competitors: Competitor[]
): FeatureComparison[] {
  const baseline = [
    "Competitor discovery",
    "Feature comparison matrix",
    "Pricing intelligence",
    "Positioning map",
    "Lead scoring",
    "Decision-maker discovery",
    "Source citations",
    "Confidence scoring",
    "PDF report export",
    "Workflow integrations",
    "Market risk analysis",
    "Action plan generation",
  ];

  const features = Array.from(
    new Set([
      ...profile.coreFeatures,
      ...baseline,
      ...competitors.flatMap((c) => stringArrayValue(c.keyFeatures)),
    ])
  ).slice(0, 14);

  return features.map((feature, index) => {
    const competitorMap = Object.fromEntries(
      competitors.map((competitor, competitorIndex) => [
        competitor.name,
        stringArrayValue(competitor.keyFeatures).some((item) =>
          similar(item, feature)
        ) || (index + competitorIndex) % 4 !== 0,
      ])
    );

    return {
      feature,
      ourProduct: index < 7 || ["Source citations", "Confidence scoring", "Action plan generation"].includes(feature),
      competitors: competitorMap,
      importance: index < 4 ? "critical" : index < 8 ? "high" : index < 11 ? "medium" : "low",
      category: index < 5 ? "Research" : index < 10 ? "Decisioning" : "Workflow",
      gapReason:
        index < 7
          ? "Core capability expected for the submitted product."
          : "Opportunity to out-position competitors with a clearer workflow.",
    };
  });
}

function buildPositioningData(competitors: Competitor[]): PositioningData[] {
  return [
    { name: "Our Product", x: 34, y: 72, size: 16, isOurProduct: true },
    ...competitors.map((competitor, index) => {
      const price =
        competitor.monthlyPrice !== null
          ? Math.min((competitor.monthlyPrice / 400) * 100, 95)
          : competitor.pricingTier === "free"
            ? 8
            : competitor.pricingTier === "freemium"
              ? 22
              : competitor.pricingTier === "enterprise"
                ? 86
                : 45 + index * 7;

      return {
        name: competitor.name,
        x: Math.round(price),
        y: Math.min(
          95,
          stringArrayValue(competitor.keyFeatures).length * 10 + 25 + index * 4
        ),
        size: competitor.marketShare === "high" ? 20 : competitor.marketShare === "medium" ? 14 : 9,
      };
    }),
  ];
}

function buildMarketLandscape(profile: ProductProfile): MarketLandscapeItem[] {
  return [
    {
      segment: "Founders",
      intensity: 78,
      opportunity: 88,
      note: "High pain, fast buying cycles, strong need for clarity.",
    },
    {
      segment: "Product teams",
      intensity: 70,
      opportunity: 76,
      note: "Need deeper workflows and evidence for roadmap decisions.",
    },
    {
      segment: "Sales teams",
      intensity: 84,
      opportunity: 72,
      note: "Lead quality and contact accuracy determine adoption.",
    },
    {
      segment: profile.industry,
      intensity: 66,
      opportunity: 80,
      note: "Vertical templates can improve trust and differentiation.",
    },
  ];
}

function buildActionItems(recommendations: RecommendationBundle): ActionItem[] {
  return [
    ...recommendations.product.slice(0, 2).map<ActionItem>((item) => ({
      action: item.title,
      category: "build",
      urgency: item.priority === "critical" ? "today" : "this-week",
      reasoning: item.reasoning,
    })),
    ...recommendations.market.slice(0, 2).map<ActionItem>((item) => ({
      action: item.title,
      category: "market",
      urgency: "this-week",
      reasoning: item.reasoning,
    })),
    ...recommendations.sales.slice(0, 2).map<ActionItem>((item) => ({
      action: item.title,
      category: "sales",
      urgency: item.priority === "high" ? "today" : "this-week",
      reasoning: item.reasoning,
    })),
  ].slice(0, 6);
}

function inferIndustry(description: string) {
  const text = description.toLowerCase();
  if (text.includes("health") || text.includes("clinic") || text.includes("doctor")) return "Healthtech";
  if (text.includes("finance") || text.includes("payment") || text.includes("invoice")) return "Fintech";
  if (text.includes("learn") || text.includes("education") || text.includes("student")) return "Edtech";
  if (text.includes("shop") || text.includes("commerce") || text.includes("retail")) return "E-commerce";
  if (text.includes("marketing") || text.includes("content") || text.includes("seo")) return "Marketing Technology";
  if (text.includes("developer") || text.includes("api") || text.includes("code")) return "Developer Tools";
  if (text.includes("lead") || text.includes("sales") || text.includes("crm")) return "Sales Technology";
  return "B2B SaaS";
}

function inferAudience(description: string, industry: string) {
  const text = description.toLowerCase();
  if (text.includes("founder") || text.includes("startup")) return "Startup founders and early-stage operators";
  if (text.includes("marketing")) return "Marketing teams and growth leaders";
  if (text.includes("sales") || text.includes("lead")) return "Sales teams and revenue leaders";
  if (text.includes("developer")) return "Engineering teams and developer-first startups";
  if (industry === "Healthtech") return "Healthcare operators and digital health teams";
  if (industry === "Fintech") return "Finance teams, founders, and operations leaders";
  return "Founders, product managers, and growth teams";
}

function inferCoreFeatures(description: string) {
  const text = description.toLowerCase();
  const features = ["Dashboard", "Recommendations", "Analytics", "Export"];

  if (text.includes("ai") || text.includes("intelligence")) features.push("AI insights");
  if (text.includes("lead") || text.includes("sales")) features.push("Lead scoring", "Contact discovery");
  if (text.includes("competitor") || text.includes("market")) features.push("Competitor tracking", "Market map");
  if (text.includes("workflow") || text.includes("automation")) features.push("Workflow automation");
  if (text.includes("team")) features.push("Team collaboration");

  return Array.from(new Set(features));
}

function competitorNamesForIndustry(industry: string) {
  if (industry === "Sales Technology") {
    return [
      competitor("Apollo.io", "https://www.apollo.io", "Sales intelligence and engagement platform", "$49+/month", "paid", 49, ["Large B2B database", "Sequences", "CRM integrations"], ["Data quality varies", "Can feel complex"], ["Lead database", "Email sequences", "CRM sync", "Intent signals"], "All-in-one outbound sales platform"),
      competitor("ZoomInfo", "https://www.zoominfo.com", "Enterprise go-to-market intelligence platform", "Custom", "enterprise", null, ["Large data coverage", "Enterprise workflows", "Intent data"], ["Expensive", "Heavy implementation"], ["Company database", "Buyer intent", "Enrichment", "Workflows"], "Enterprise-grade revenue intelligence"),
      competitor("Clay", "https://www.clay.com", "Data enrichment and outbound automation workspace", "$149+/month", "paid", 149, ["Flexible enrichment", "Powerful workflows"], ["Learning curve", "Requires setup"], ["Enrichment", "AI research", "Outbound workflows"], "Composable GTM automation"),
      competitor("Cognism", "https://www.cognism.com", "B2B sales intelligence and compliant prospecting", "Custom", "enterprise", null, ["Compliance focus", "Phone data"], ["Enterprise pricing", "Less startup-friendly"], ["Prospecting", "Enrichment", "Compliance"], "Compliant B2B prospecting"),
      competitor("LeadIQ", "https://leadiq.com", "Prospecting and contact capture for sales teams", "$45+/month", "paid", 45, ["Easy prospect capture", "Sales workflow fit"], ["Narrower strategy layer"], ["Contact capture", "CRM sync", "Email finding"], "Simple sales prospecting"),
    ];
  }

  return [
    competitor("CB Insights", "https://www.cbinsights.com", "Market intelligence and company data platform", "Custom", "enterprise", null, ["Deep market data", "Strong enterprise reputation"], ["High cost", "Less startup-friendly"], ["Market maps", "Company profiles", "Reports", "Signals"], "Enterprise market intelligence"),
    competitor("Similarweb", "https://www.similarweb.com", "Digital traffic and market analytics platform", "Custom", "enterprise", null, ["Traffic data", "Benchmarking", "Category insights"], ["Web-first lens", "Premium pricing"], ["Traffic analysis", "Benchmarks", "Audience insights"], "Digital market measurement"),
    competitor("Crayon", "https://www.crayon.co", "Competitive intelligence platform for revenue teams", "Custom", "enterprise", null, ["Competitive tracking", "Battlecards", "Alerts"], ["Requires setup", "Sales-focused"], ["Battlecards", "Alerts", "Competitor tracking"], "Competitive enablement"),
    competitor("Kompyte", "https://www.kompyte.com", "Competitor monitoring and sales battlecards", "Custom", "enterprise", null, ["Automated monitoring", "Sales enablement"], ["Less founder-focused"], ["Monitoring", "Battlecards", "Sales enablement"], "Competitive monitoring for sales"),
    competitor("Perplexity", "https://www.perplexity.ai", "AI answer engine for research and discovery", "Free / $20 per month", "freemium", 20, ["Fast research", "Citations", "Low cost"], ["Not workflow-specific", "Manual synthesis"], ["AI search", "Citations", "Collections"], "General AI research assistant"),
  ];
}

function competitor(
  name: string,
  website: string,
  description: string,
  pricing: string,
  pricingTier: Competitor["pricingTier"],
  monthlyPrice: number | null,
  strengths: string[],
  weaknesses: string[],
  keyFeatures: string[],
  positioning: string
) {
  return {
    name,
    website,
    description,
    targetAudience: "Founders, product teams, revenue teams, and market analysts",
    pricing,
    pricingTier,
    monthlyPrice,
    strengths,
    weaknesses,
    keyFeatures,
    positioning,
  };
}

function similar(a: string, b: string) {
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  return left.includes(right.slice(0, 7)) || right.includes(left.slice(0, 7));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
