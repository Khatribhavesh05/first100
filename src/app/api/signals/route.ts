import { GoogleGenerativeAI } from "@google/generative-ai";
import { tavily } from "@tavily/core";
import { type NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

const genai = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SignalsReport {
  summary: {
    totalSignals: number;
    urgencyScore: number;
    topPainPoints: string[];
    topCommunities: Array<{
      name: string;
      platform: string;
      memberCount: string;
      activity: "high" | "medium" | "low";
      whyRelevant: string;
    }>;
    bestTimeToPost: string;
    marketValidation: string;
  };
  signals: Array<{
    id: string;
    platform: string;
    username: string;
    subreddit?: string;
    score?: number;
    quote: string;
    context: string;
    painKeywords: string[];
    reachability: "easy" | "medium" | "hard";
    url: string;
    timeAgo: string;
  }>;
  insight: string;
}

// ── Bright Data SERP ─────────────────────────────────────────────────────────

interface SerpResult { title: string; url: string; snippet: string; source: "brightdata" | "tavily"; }

function extractResults(data: unknown): Array<{ title: string; url: string; snippet: string }> {
  if (!data) return [];
  const d = data as Record<string, unknown>;

  for (const key of ["organic", "results", "items", "organic_results"]) {
    if (Array.isArray(d[key])) {
      return (d[key] as Record<string, unknown>[])
        .map((r) => ({
          title: (r.title ?? r.name ?? "") as string,
          url: (r.url ?? r.link ?? r.href ?? "") as string,
          snippet: (r.snippet ?? r.description ?? r.text ?? "") as string,
        }))
        .filter((r) => r.url);
    }
  }

  if (Array.isArray(data)) {
    return (data as Record<string, unknown>[])
      .map((r) => ({
        title: (r.title ?? r.name ?? "") as string,
        url: (r.url ?? r.link ?? r.href ?? "") as string,
        snippet: (r.snippet ?? r.description ?? r.text ?? "") as string,
      }))
      .filter((r) => r.url);
  }

  return [];
}

async function brightDataSearch(query: string): Promise<SerpResult[]> {
  // Allow callers to append &tbs=... for time-filtering — split it out before encoding
  const tbsMatch = query.match(/(&tbs=[^&]+)$/);
  const tbsSuffix = tbsMatch ? tbsMatch[1] : "";
  const cleanQuery = tbsMatch ? query.slice(0, -tbsMatch[1].length) : query;

  const requestBody = {
    zone: "serp_api1",
    url: `https://www.google.com/search?q=${encodeURIComponent(cleanQuery)}${tbsSuffix}`,
    format: "raw",
  };

  console.log("[BrightData] Request body:", JSON.stringify(requestBody));

  const response = await fetch("https://api.brightdata.com/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.BRIGHT_DATA_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  console.log("[BrightData] Status:", response.status);

  const rawText = await response.text();
  console.log("[BrightData] Raw response first 1000 chars:", rawText.substring(0, 1000));

  if (!response.ok) {
    throw new Error(`Bright Data SERP ${response.status}: ${rawText.slice(0, 200)}`);
  }

  // Try JSON parse first (in case API returns structured data despite format:raw)
  let extracted: Array<{ title: string; url: string; snippet: string }> = [];
  try {
    const data = JSON.parse(rawText);
    console.log("[BrightData] All response keys:", JSON.stringify(Object.keys(data as Record<string, unknown>)));
    extracted = extractResults(data);
  } catch {
    // Raw HTML — extract URLs via regex
    console.log("[BrightData] Response is raw HTML, extracting hrefs via regex");
  }

  if (extracted.length === 0) {
    const urls = rawText
      .match(/href="(https?:\/\/[^"]+)"/g)
      ?.map((h) => h.replace(/^href="/, "").replace(/"$/, ""))
      .filter((u) => !u.includes("google.com") && !u.includes("googleapis"))
      .slice(0, 10) ?? [];

    extracted = urls.map((url) => ({
      title: url.split("/").filter(Boolean).pop() ?? url,
      url,
      snippet: `Found via live web search for: ${query}`,
    }));
    console.log(`[BrightData] Regex extracted ${extracted.length} URLs from HTML`);
  }

  console.log(`[BrightData] Total extracted ${extracted.length} results for query: "${query}"`);
  return extracted.slice(0, 10).map((r) => ({ ...r, source: "brightdata" as const }));
}

// ── Reddit API ───────────────────────────────────────────────────────────────

interface RedditPost {
  title: string;
  url: string;
  snippet: string;
  username: string;
  subreddit: string;
  created: number;
  score: number;
}

function timeAgoFromUtc(utc: number): string {
  const seconds = Math.floor(Date.now() / 1000) - utc;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
  return `${Math.floor(seconds / 2592000)} months ago`;
}

async function searchReddit(query: string, limit = 10): Promise<RedditPost[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://www.reddit.com/search.json?q=${encodedQuery}&sort=new&limit=${limit}&restrict_sr=false&type=link`,
      {
        headers: {
          "User-Agent": "First100CustomerDiscovery:v1.0 (by /u/first100app)",
          "Accept": "application/json",
          "Accept-Language": "en-US,en;q=0.9",
        },
      }
    );

    if (!response.ok) {
      console.log(`[Reddit] HTTP ${response.status}, falling back to RSS for: "${query}"`);
      const rssResponse = await fetch(
        `https://www.reddit.com/search.rss?q=${encodedQuery}&sort=new&limit=${limit}`,
        { headers: { "User-Agent": "First100CustomerDiscovery:v1.0" } }
      );
      const rssText = await rssResponse.text();
      const items = rssText.match(/<entry>([\s\S]*?)<\/entry>/g) ?? [];
      return items.slice(0, limit).map((item) => {
        const title = item.match(/<title[^>]*>(.*?)<\/title>/)?.[1] ?? "";
        const link = item.match(/<link[^>]*href="([^"]+)"/)?.[1] ?? "";
        const author = item.match(/<name>(.*?)<\/name>/)?.[1] ?? "reddit_user";
        const content = item.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1]?.substring(0, 200) ?? title;
        return {
          title: title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
          url: link,
          snippet: content,
          username: author,
          subreddit: "r/relevant",
          created: Date.now() / 1000,
          score: 0,
        };
      }).filter((r) => r.url);
    }

    const data = await response.json() as { data?: { children?: Array<{ data: Record<string, unknown> }> } };
    const posts = data?.data?.children ?? [];
    console.log(`[Reddit] Got ${posts.length} posts for: "${query}"`);
    return posts.map((post) => ({
      title: (post.data.title as string) ?? "",
      url: `https://www.reddit.com${post.data.permalink as string}`,
      snippet: ((post.data.selftext as string)?.substring(0, 200)) || ((post.data.title as string) ?? ""),
      username: (post.data.author as string) ?? "unknown",
      subreddit: (post.data.subreddit_name_prefixed as string) ?? "r/unknown",
      created: (post.data.created_utc as number) ?? 0,
      score: (post.data.score as number) ?? 0,
    }));
  } catch (e) {
    console.log("[Reddit] Failed:", e);
    return [];
  }
}

// ── Keyword extractor ────────────────────────────────────────────────────────

function extractKeywords(text: string): string {
  const stopWords = new Set([
    "a","an","the","is","are","i","my","that","for","and","or","to","of","in",
    "it","this","with","by","from","as","be","was","will","have","has","do",
    "does","am","them","there","their","make","want","followed","building",
    "startup","m","we","our","you","your","they","about","what","how","when",
    "where","who","which","at","on","into","tool","app","software","platform",
    "using","use","need","help","just","like","more","some","get","can","if",
  ]);
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => !stopWords.has(w) && w.length > 3)
    .slice(0, 4)
    .join(" ");
}

// ── Tavily fallback ───────────────────────────────────────────────────────────

interface TavilyResult { title: string; url: string; content: string; }

async function tavilySearch(query: string): Promise<{ text: string; results: TavilyResult[] }> {
  if (!process.env.TAVILY_API_KEY) return { text: "", results: [] };
  try {
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
    const resp = await tvly.search(query, { maxResults: 8, searchDepth: "advanced" });
    if (!resp.results.length) {
      const retry = await tvly.search(query.split(" ").slice(0, 5).join(" "), { maxResults: 6, searchDepth: "advanced" });
      return {
        text: retry.results.map((r) => `### ${r.title}\n${r.url}\n${r.content}`).join("\n\n"),
        results: retry.results,
      };
    }
    return {
      text: resp.results.map((r) => `### ${r.title}\n${r.url}\n${r.content}`).join("\n\n"),
      results: resp.results,
    };
  } catch {
    return { text: "", results: [] };
  }
}

// ── Gemini synthesis ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a JSON-only response bot. You must ALWAYS respond with a valid JSON object and nothing else. No explanations, no markdown, no backticks, no text before or after the JSON. Your entire response must be parseable by JSON.parse(). Start with { and end with }.

CRITICAL URL RULES:
- For each signal, you MUST use the exact URL from the SOURCE data provided. Do not generate, shorten, or modify URLs. Copy them character-for-character.
- Derive the platform from the URL domain: reddit.com → "Reddit", indiehackers.com → "IndieHackers", producthunt.com → "ProductHunt", quora.com → "Quora". Do not guess platform from context.
- If no URL is available, use an empty string — never fabricate a URL.`;

function safeParse(text: string): Record<string, unknown> | null {
  const cleaned = text
    .trim()
    .replace(/^```json\n?/i, "")
    .replace(/^```\n?/i, "")
    .replace(/```\n?$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const lastBrace = cleaned.lastIndexOf("}");
    const lastBracket = cleaned.lastIndexOf("]");
    const lastValid = Math.max(lastBrace, lastBracket);
    if (lastValid > 0) {
      try {
        return JSON.parse(cleaned.substring(0, lastValid + 1) + "}}") as Record<string, unknown>;
      } catch {
        try {
          return JSON.parse(cleaned.substring(0, lastValid + 1)) as Record<string, unknown>;
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}

async function generateWithRetry(
  systemPrompt: string,
  userMsg: string,
  retries = 3
): Promise<string> {
  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-8b"];
  let lastError: unknown;

  for (const modelName of models) {
    for (let i = 0; i < retries; i++) {
      try {
        const model = genai.getGenerativeModel({ model: modelName, systemInstruction: systemPrompt });
        const result = await model.generateContent(userMsg);
        return result.response.text().trim()
          .replace(/^```json\n?/i, "")
          .replace(/^```\n?/i, "")
          .replace(/```\n?$/i, "")
          .trim();
      } catch (e) {
        lastError = e;
        console.warn(`[Gemini] ${modelName} attempt ${i + 1} failed:`, e instanceof Error ? e.message : e);
        if (i < retries - 1) await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
      }
    }
    console.warn(`[Gemini] ${modelName} exhausted retries, trying fallback model`);
  }

  throw lastError;
}

async function synthesizeWithGemini(
  idea: string,
  targetCustomer: string,
  geography: string,
  redditData: string,
  serpData: string,
  tavilyData: string,
  dataSource: "brightdata" | "tavily" | "none",
  urlMap: Record<string, string>
): Promise<SignalsReport> {
  const dataSourceNote =
    dataSource === "brightdata"
      ? "DATA SOURCE: Live Reddit API + Bright Data SERP results."
      : dataSource === "tavily"
      ? "DATA SOURCE: Web search results via Tavily. Label platform as 'Web' where the source domain is not clearly Reddit/IH/PH/Quora."
      : "DATA SOURCE: No live data — synthesize realistic signals from your knowledge.";

  const urlMapNote = Object.keys(urlMap).length
    ? `\nURL REFERENCE MAP (copy these URLs exactly — do not modify):\n${Object.entries(urlMap).map(([k, v]) => `  [${k}] → ${v}`).join("\n")}`
    : "";

  const userMsg = `You are a customer discovery agent for First100. A founder has described their startup idea. You have live data from Reddit and other platforms showing real people complaining about related problems. Extract real customer signals and return them as JSON.

STARTUP IDEA: ${idea}
TARGET CUSTOMER: ${targetCustomer}
GEOGRAPHY: ${geography}
${dataSourceNote}
${urlMapNote}

${redditData ? `REDDIT API RESULTS (real posts — use exact usernames, subreddits, URLs, scores, and timeAgo values):\n${redditData}` : ""}
${serpData ? `\nOTHER PLATFORM RESULTS (IndieHackers / ProductHunt / Quora):\n${serpData}` : ""}
${tavilyData ? `\nWEB SEARCH RESULTS (Tavily):\n${tavilyData}` : ""}

Return this exact JSON structure with no other text:
{
  "summary": {
    "totalSignals": number,
    "urgencyScore": number (0-100, how urgent is this pain right now),
    "topPainPoints": ["specific pain 1 from actual data", "pain 2", "pain 3"],
    "topCommunities": [
      {
        "name": "exact community name e.g. r/lawyers",
        "platform": "Reddit | IndieHackers | ProductHunt | Quora | Web",
        "memberCount": "estimated size",
        "activity": "high | medium | low",
        "whyRelevant": "one sentence"
      }
    ],
    "bestTimeToPost": "specific day and time with reasoning",
    "marketValidation": "one paragraph — is this pain real and urgent based on the data"
  },
  "signals": [
    {
      "id": "unique id",
      "platform": "Reddit | IndieHackers | ProductHunt | Quora | Web",
      "username": "for Reddit: use the exact u/username from the source data (include u/ prefix). For IndieHackers: use 'IH Member' or the real username if visible in the URL/title. For Quora: use 'Quora User'. For ProductHunt: use 'PH Maker' or 'PH User'. NEVER use 'Anonymous' or 'web_****' or empty string.",
      "subreddit": "for Reddit signals: the exact subreddit e.g. r/lawyers. Empty string for non-Reddit.",
      "score": "for Reddit signals: the upvote score as a number. 0 for non-Reddit.",
      "quote": "their actual complaint or pain expression — max 150 chars, make it feel real and specific",
      "context": "what they were asking for or complaining about in one sentence",
      "painKeywords": ["keyword1", "keyword2"],
      "reachability": "easy | medium | hard",
      "url": "MUST be copied exactly from the SOURCE URL above — do not modify or generate. Empty string if none.",
      "timeAgo": "for Reddit posts: use the exact timeAgo value from source data (e.g. '3 hours ago', '2 days ago'). For IndieHackers/Quora/ProductHunt: generate a realistic relative time like '3 hours ago', '1 day ago', '2 days ago', or '5 hours ago'. Never use just 'recently'."
    }
  ],
  "insight": "Most important insight from all signals in 2-3 sentences. Be specific about what the data shows."
}`;

  const raw = await generateWithRetry(SYSTEM_PROMPT, userMsg);
  console.log("[Gemini] Raw response first 500 chars:", raw.substring(0, 500));
  const parsed = safeParse(raw);
  if (!parsed) throw new Error("Failed to parse Gemini response as JSON.");
  return parsed as unknown as SignalsReport;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const startTime = Date.now();
    const body = await req.json() as { idea?: string; targetCustomer?: string; geography?: string };
    const { idea, targetCustomer, geography = "Global" } = body;

    if (!idea || typeof idea !== "string" || idea.trim().length < 5) {
      return NextResponse.json({ error: "idea is required (min 5 chars)." }, { status: 400 });
    }
    if (!targetCustomer || typeof targetCustomer !== "string") {
      return NextResponse.json({ error: "targetCustomer is required." }, { status: 400 });
    }

    const trimmedIdea = idea.trim();
    const trimmedCustomer = targetCustomer.trim();
    const ideaKw = extractKeywords(trimmedIdea);
    const customerKw = extractKeywords(trimmedCustomer);
    console.log(`[Signals] Keywords — idea: "${ideaKw}" | customer: "${customerKw}"`);

    // ── Stage 1: Reddit API (primary) ────────────────────────────────────────
    const [redditA, redditB, redditC] = await Promise.all([
      searchReddit(`${ideaKw} problem OR frustrated OR struggling`, 15),
      searchReddit(`${customerKw} need tool OR looking for solution`, 15),
      searchReddit(`${ideaKw} alternative OR recommendation`, 10),
    ]);
    const allReddit = [...redditA, ...redditB, ...redditC];
    console.log(`[Signals] Reddit API total: ${allReddit.length} posts`);

    // ── Stage 2: Bright Data for IH / PH / Quora ─────────────────────────────
    let allSerp: SerpResult[] = [];
    const nonRedditQueries = [
      `site:indiehackers.com ${ideaKw} customers OR struggle OR advice&tbs=qdr:m`,
      `site:producthunt.com ${ideaKw} alternative OR review&tbs=qdr:y`,
      `site:quora.com ${ideaKw} problem OR alternative OR frustrated&tbs=qdr:y`,
      `site:quora.com ${customerKw} struggling OR looking for&tbs=qdr:y`,
    ];
    try {
      const bdResults = await Promise.allSettled(nonRedditQueries.map((q) => brightDataSearch(q)));
      for (const r of bdResults) {
        if (r.status === "fulfilled") allSerp = allSerp.concat(r.value);
      }
      console.log(`[Signals] Bright Data (IH/PH/Quora): ${allSerp.length} results`);
    } catch (err) {
      console.error("[Signals] Bright Data failed:", err);
    }

    // ── Stage 3: Tavily fallback if both sources are thin ────────────────────
    const tavilyQuery = `${ideaKw} ${customerKw} complaints pain points alternatives`;
    const { text: tvData, results: tvResults } = await tavilySearch(tavilyQuery).catch(() => ({ text: "", results: [] }));
    console.log(`[Signals] Tavily: ${tvResults.length} results`);

    // ── Build context strings ─────────────────────────────────────────────────
    const urlMap: Record<string, string> = {};

    const redditData = allReddit.length
      ? allReddit.map((p, i) => {
          const key = `R${i}`;
          urlMap[key] = p.url;
          urlMap[p.title] = p.url;
          return `[REDDIT ${key}] u/${p.username} in ${p.subreddit} | SCORE: ${p.score} | TIME: ${timeAgoFromUtc(p.created)} | URL: ${p.url} | POST: ${p.title} | BODY: ${p.snippet}`;
        }).join("\n\n")
      : "";

    allSerp.forEach((r, i) => {
      const key = `S${i}`;
      urlMap[key] = r.url;
      urlMap[r.title] = r.url;
    });
    const serpData = allSerp.length
      ? allSerp.map((r, i) => `[SOURCE S${i}] URL: ${r.url} | TITLE: ${r.title} | SNIPPET: ${r.snippet}`).join("\n\n")
      : "";

    const dataSource: "brightdata" | "tavily" | "none" =
      allReddit.length > 0 ? "brightdata" : tvData ? "tavily" : "none";

    console.log(`[Signals] urlMap has ${Object.keys(urlMap).length} entries`);

    const report = await synthesizeWithGemini(
      trimmedIdea,
      trimmedCustomer,
      geography,
      redditData,
      serpData,
      tvData,
      dataSource,
      urlMap
    );

    const scanDuration = Math.round((Date.now() - startTime) / 1000);
    const brightDataSearches = nonRedditQueries.length;
    const apiCallCount = (allReddit.length > 0 ? 3 : 0) + brightDataSearches + (tvData ? 1 : 0);

    return NextResponse.json({
      success: true,
      data: report,
      apiCallCount,
      scanDuration,
      brightDataSearches,
    });
  } catch (err) {
    console.error("[Signals] Pipeline error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Signals scan failed: ${message}` }, { status: 500 });
  }
}
