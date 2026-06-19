import axios from "axios";
import type { Evidence } from "./types";

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results?: TavilySearchResult[];
  answer?: string;
}

function timeoutAfter(ms: number) {
  return new Promise<[]>(resolve => {
    setTimeout(() => resolve([]), ms);
  });
}

export async function searchWeb(
  query: string,
  maxResults = 5
): Promise<TavilySearchResult[]> {
  if (!process.env.TAVILY_API_KEY) {
    return [];
  }

  try {
    const response = await Promise.race([
      axios.post<TavilyResponse>(
        "https://api.tavily.com/search",
        {
          api_key: process.env.TAVILY_API_KEY,
          query,
          max_results: maxResults,
          search_depth: "basic",
          include_answer: true,
        },
        { timeout: 8000 }
      ),
      timeoutAfter(8000),
    ]);

    if (Array.isArray(response)) {
      return response;
    }

    return response.data.results ?? [];
  } catch (error) {
    console.error("Tavily search error:", error);
    return [];
  }
}

export function formatSearchResults(results: TavilySearchResult[]) {
  return results
    .map((result) => {
      return `Title: ${result.title}\nURL: ${result.url}\nContent: ${result.content}`;
    })
    .join("\n\n---\n\n");
}

export function searchResultsToEvidence(results: TavilySearchResult[]): Evidence[] {
  return results.slice(0, 3).map((result) => ({
    label: result.title,
    url: result.url,
    kind: "verified",
  }));
}

export async function searchCompetitors(productDescription: string) {
  const results = await searchWeb(
    `top competitors alternatives for ${productDescription} product pricing features`,
    8
  );

  return {
    text: formatSearchResults(results),
    evidence: searchResultsToEvidence(results),
  };
}

export async function searchLeads(targetAudience: string, industry: string) {
  const results = await searchWeb(
    `companies in ${industry} buying tools for ${targetAudience} decision makers`,
    8
  );

  return {
    text: formatSearchResults(results),
    evidence: searchResultsToEvidence(results),
  };
}
