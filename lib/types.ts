export type Priority = "critical" | "high" | "medium" | "low";
export type ConfidenceKind = "verified" | "inferred" | "assumption";

export interface AnalysisInput {
  productDescription: string;
  websiteUrl?: string;
  companyName?: string;
}

export interface Evidence {
  label: string;
  url?: string;
  kind: ConfidenceKind;
}

export interface Competitor {
  name: string;
  website: string;
  description: string;
  targetAudience: string;
  pricing: string;
  pricingTier: "free" | "freemium" | "paid" | "enterprise" | "unknown";
  monthlyPrice: number | null;
  strengths: string[];
  weaknesses: string[];
  keyFeatures: string[];
  positioning: string;
  marketShare: "high" | "medium" | "low";
  threatLevel: "high" | "medium" | "low";
  confidenceScore: number;
  sourceUrl?: string;
  isVerified: boolean;
  evidence: Evidence[];
}

export interface FeatureComparison {
  feature: string;
  ourProduct: boolean;
  competitors: Record<string, boolean>;
  importance: Priority;
  category: string;
  gapReason: string;
}

export interface Lead {
  companyName: string;
  website: string;
  industry: string;
  employeeSize: string;
  location: string;
  contactPerson: string;
  jobTitle: string;
  linkedinProfile?: string;
  businessEmail?: string;
  relevanceReason: string;
  confidenceScore: number;
  priorityScore: number;
  sourceUrl?: string;
  additionalInfo: string;
  isVerified: boolean;
  evidence: Evidence[];
}

export interface Recommendation {
  title: string;
  description: string;
  reasoning: string;
  priority: Priority;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  timeframe: string;
  confidenceScore: number;
  evidence: Evidence[];
}

export interface MarketOpportunity {
  opportunity: string;
  description: string;
  marketSize: string;
  difficulty: "low" | "medium" | "high";
  priority: number;
  confidenceScore: number;
}

export interface ActionItem {
  action: string;
  category: "build" | "market" | "sales" | "research";
  urgency: "today" | "this-week" | "this-month";
  reasoning: string;
}

export interface PositioningData {
  name: string;
  x: number;
  y: number;
  size: number;
  isOurProduct?: boolean;
}

export interface MarketLandscapeItem {
  segment: string;
  intensity: number;
  opportunity: number;
  note: string;
}

export interface AnalysisResult {
  input: AnalysisInput;
  productSummary: string;
  targetAudience: string;
  industry: string;
  competitors: Competitor[];
  featureComparison: FeatureComparison[];
  leads: Lead[];
  productRecommendations: Recommendation[];
  marketRecommendations: Recommendation[];
  salesRecommendations: Recommendation[];
  opportunities: MarketOpportunity[];
  risks: string[];
  actionItems: ActionItem[];
  positioningData: PositioningData[];
  marketLandscape: MarketLandscapeItem[];
  marketInsight: string;
  assumptions: string[];
  generatedAt: string;
}

export interface ApiError {
  error: string;
  details?: string;
}
