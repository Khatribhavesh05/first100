import { GoogleGenerativeAI } from "@google/generative-ai";
import { tavily } from "@tavily/core";
import { type NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── Types ─────────────────────────────────────────────────────────────────────

interface SerpResult {
  title: string;
  url: string;
  snippet: string;
}

export interface ResearchReport {
  summary: {
    marketOverview: string;
    totalCompetitors: number;
    marketMaturity: "emerging" | "growing" | "mature" | "declining";
    quickVerdict: string;
  };
  competitors: Array<{
    name: string;
    website: string;
    tagline: string;
    description: string;
    pricing: string;
    targetCustomer: string;
    strengths: string[];
    weaknesses: string[];
    fundingStatus: string;
    threatLevel: "high" | "medium" | "low";
    stealableUsers: string;
  }>;
  marketGaps: Array<{
    gap: string;
    evidence: string;
    opportunity: string;
    size: "large" | "medium" | "small";
  }>;
  opportunities: string[];
  warning?: string;
}

// ── Stage 1: Bright Data SERP ─────────────────────────────────────────────────

async function brightDataSearch(idea: string): Promise<SerpResult[]> {
  const searchUrl =
    `https://www.google.com/search?q=${encodeURIComponent(`${idea} competitors alternatives pricing`)}&num=10`;

  const res = await fetch("https://api.brightdata.com/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.BRIGHT_DATA_API_KEY}`,
    },
    body: JSON.stringify({ zone: "serp_api1", url: searchUrl, format: "json" }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Bright Data SERP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json() as Record<string, unknown>;

  // Handle both possible key names the API may return
  const organic =
    (data.organic as Array<Record<string, string>> | undefined) ??
    (data.results as Array<Record<string, string>> | undefined) ??
    [];

  return organic.slice(0, 10).map((r) => ({
    title: r.title ?? "",
    url: r.link ?? r.url ?? "",
    snippet: r.description ?? r.snippet ?? "",
  }));
}

// ── Stage 2: Tavily enrichment (copied from Qrew alex/generate/route.ts) ─────

async function tavilySearch(query: string): Promise<string> {
  if (!process.env.TAVILY_API_KEY) return "";
  try {
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
    const results = await tvly.search(query, { maxResults: 8, searchDepth: "advanced" });
    if (!results.results.length) {
      const broader = query.split(" ").slice(0, 5).join(" ") + " market size statistics";
      const retry = await tvly.search(broader, { maxResults: 6, searchDepth: "advanced" });
      return retry.results.map((r) => `### ${r.title}\n${r.url}\n${r.content}`).join("\n\n");
    }
    return results.results.map((r) => `### ${r.title}\n${r.url}\n${r.content}`).join("\n\n");
  } catch {
    return "";
  }
}

// ── Stage 3: Gemini synthesis ─────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a brutally honest market research analyst for FounderScope.
A founder has described their startup idea. You have live web data from Bright Data SERP and Tavily enrichment.

Analyze this data and return a single valid JSON object only. No markdown. No backticks. Start with { end with }.

{
  "summary": {
    "marketOverview": "3 paragraphs — market size with sources, growth rate, key trends, why now",
    "totalCompetitors": number,
    "marketMaturity": "emerging | growing | mature | declining",
    "quickVerdict": "2 sentences — is this worth building"
  },
  "competitors": [
    {
      "name": "exact company name",
      "website": "actual URL",
      "tagline": "their actual tagline or positioning",
      "description": "what they do in 2 sentences",
      "pricing": "actual pricing if found, else best estimate with (estimated) label",
      "targetCustomer": "who they serve specifically",
      "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
      "weaknesses": ["specific exploitable weakness 1", "specific weakness 2"],
      "fundingStatus": "Bootstrapped | $XM raised | Unknown",
      "threatLevel": "high | medium | low",
      "stealableUsers": "specific type of their unhappy user you can target and exact reason why"
    }
  ],
  "marketGaps": [
    {
      "gap": "Gap title in 5 words",
      "evidence": "specific evidence this gap exists from the web data",
      "opportunity": "exactly how to exploit this gap",
      "size": "large | medium | small"
    }
  ],
  "opportunities": ["specific opportunity 1", "specific opportunity 2", "specific opportunity 3"]
}`;

async function synthesizeWithGemini(
  idea: string,
  targetMarket: string,
  serpData: string,
  tavilyData: string,
  dataWarning?: string
): Promise<ResearchReport> {
  const model = genai.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  const userMsg = `Research this startup idea now using all web data below.
Output the JSON report only. No markdown. No explanation. Start your response with { and end with }.

STARTUP IDEA: ${idea}
TARGET MARKET: ${targetMarket}

${serpData ? `BRIGHT DATA SERP RESULTS:\n${serpData}` : ""}
${tavilyData ? `\n\nTAVILY ENRICHMENT:\n${tavilyData}` : ""}
${!serpData && !tavilyData ? "Limited web data available — use your training knowledge, mark uncertain data as (estimated)." : ""}`;

  const result = await model.generateContent(userMsg);
  const raw = result.response.text().trim()
    .replace(/^```json\n?/i, "")
    .replace(/^```\n?/i, "")
    .replace(/```\n?$/i, "")
    .trim();

  const parsed = JSON.parse(raw) as ResearchReport;

  if (dataWarning) parsed.warning = dataWarning;
  return parsed;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { idea?: string; targetMarket?: string };
    const { idea, targetMarket } = body;

    if (!idea || typeof idea !== "string" || idea.trim().length < 5) {
      return NextResponse.json({ error: "idea is required (min 5 chars)." }, { status: 400 });
    }
    if (!targetMarket || typeof targetMarket !== "string") {
      return NextResponse.json({ error: "targetMarket is required." }, { status: 400 });
    }

    const trimmedIdea = idea.trim();
    const trimmedMarket = targetMarket.trim();

    // ── Stage 1: Bright Data SERP ──────────────────────────────────────────────
    let serpResults: SerpResult[] = [];
    let serpFailed = false;
    try {
      serpResults = await brightDataSearch(trimmedIdea);
      console.log(`[Research] Bright Data returned ${serpResults.length} SERP results`);
    } catch (err) {
      console.error("[Research] Bright Data SERP failed:", err);
      serpFailed = true;
    }

    // Format SERP results for Gemini context
    const serpData = serpResults.length
      ? serpResults
          .map((r, i) => `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.snippet}`)
          .join("\n\n")
      : "";

    // ── Stage 2: Tavily enrichment for top 5 competitors ──────────────────────
    const top5 = serpResults.slice(0, 5);
    let tavilyData = "";
    let tavilyFailed = false;

    try {
      // Run Tavily searches in parallel: 1 broad market search + 1 per competitor
      const [marketSearch, ...competitorSearches] = await Promise.all([
        tavilySearch(`${trimmedIdea} market size competitors 2024 2025`),
        ...top5.map((r) =>
          tavilySearch(`${r.title} pricing features reviews ${trimmedIdea}`)
        ),
      ]);

      const allResults = [marketSearch, ...competitorSearches].filter(Boolean);
      tavilyData = allResults.join("\n\n---\n\n");
      console.log(`[Research] Tavily returned data for ${allResults.length} searches`);
    } catch (err) {
      console.error("[Research] Tavily enrichment failed:", err);
      tavilyFailed = true;
    }

    // Build warning string if data sources degraded
    let dataWarning: string | undefined;
    if (serpFailed && tavilyFailed) {
      dataWarning =
        "⚠️ Live web data unavailable — this report is based on Gemini's training knowledge. Results may not reflect the latest market state.";
    } else if (serpFailed) {
      dataWarning = "Note: Bright Data SERP was unavailable. Report enriched with Tavily data only.";
    }

    // ── Stage 3: Gemini synthesis ──────────────────────────────────────────────
    const report = await synthesizeWithGemini(
      trimmedIdea,
      trimmedMarket,
      serpData,
      tavilyData,
      dataWarning
    );

    return NextResponse.json({ success: true, data: report });
  } catch (err) {
    console.error("[Research] Pipeline error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Research failed: ${message}` }, { status: 500 });
  }
}
