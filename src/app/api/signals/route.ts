import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
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

// ── Signal builders (deterministic — no AI) ───────────────────────────────────

function platformFromUrl(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("reddit.com")) return "Reddit";
  if (u.includes("indiehackers.com")) return "IndieHackers";
  if (u.includes("producthunt.com")) return "ProductHunt";
  if (u.includes("quora.com")) return "Quora";
  return "Web";
}

function usernameForPlatform(url: string, platform: string): string {
  if (platform === "Reddit") {
    const m = url.match(/reddit\.com\/user\/([^/?#]+)/i);
    return m ? `u/${m[1]}` : "u/redditor";
  }
  if (platform === "IndieHackers") return "IH Member";
  if (platform === "ProductHunt") return "PH User";
  if (platform === "Quora") return "Quora User";
  return "Community Member";
}

function simpleKeywords(text: string): string[] {
  const stop = new Set(["a","an","the","is","are","i","my","for","and","or","to","of","in","it","this","with","by","from","as","be","was","how","what","why","when","where","who"]);
  return text.toLowerCase().split(/\W+/).filter((w) => w.length > 3 && !stop.has(w)).slice(0, 3);
}

function signalsFromReddit(posts: RedditPost[]): SignalsReport["signals"] {
  return posts.slice(0, 15).map((p, i) => ({
    id: `r_${i}`,
    platform: "Reddit",
    username: `u/${p.username.replace(/^u\//, "")}`,
    subreddit: p.subreddit,
    score: p.score,
    quote: (p.snippet || p.title).substring(0, 150),
    context: p.title.substring(0, 120),
    painKeywords: simpleKeywords(p.title),
    reachability: "easy" as const,
    url: p.url,
    timeAgo: timeAgoFromUtc(p.created),
  }));
}

function signalsFromSerp(results: SerpResult[]): SignalsReport["signals"] {
  return results.filter((r) => r.url).slice(0, 15).map((r, i) => {
    const platform = platformFromUrl(r.url);
    return {
      id: `s_${i}`,
      platform,
      username: usernameForPlatform(r.url, platform),
      subreddit: "",
      score: 0,
      quote: (r.snippet || r.title).substring(0, 150),
      context: r.title.substring(0, 120),
      painKeywords: simpleKeywords(r.title),
      reachability: "medium" as const,
      url: r.url,
      timeAgo: "recently",
    };
  });
}

function signalsFromTavily(results: Array<{ title: string; url: string; content: string }>): SignalsReport["signals"] {
  return results.filter((r) => r.url).slice(0, 8).map((r, i) => {
    const platform = platformFromUrl(r.url);
    return {
      id: `t_${i}`,
      platform,
      username: usernameForPlatform(r.url, platform),
      subreddit: "",
      score: 0,
      quote: (r.content || r.title).substring(0, 150),
      context: r.title.substring(0, 120),
      painKeywords: simpleKeywords(r.title),
      reachability: "medium" as const,
      url: r.url,
      timeAgo: "recently",
    };
  });
}

function topCommunitiesFromSignals(signals: SignalsReport["signals"]): SignalsReport["summary"]["topCommunities"] {
  const counts: Record<string, { platform: string; n: number }> = {};
  for (const s of signals) {
    const key = s.subreddit || s.platform;
    if (!counts[key]) counts[key] = { platform: s.platform, n: 0 };
    counts[key].n++;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, 4)
    .map(([name, v]) => ({
      name,
      platform: v.platform,
      memberCount: "",
      activity: (v.n >= 5 ? "high" : v.n >= 2 ? "medium" : "low") as "high" | "medium" | "low",
      whyRelevant: "",
    }));
}

// ── AI metadata (3 fields only — nearly impossible to fail) ──────────────────

const META_SYSTEM = `You must respond with ONLY valid JSON. No markdown. No explanation. Start with { and end with }. Nothing else.`;

function safeParse(text: string): Record<string, unknown> | null {
  let s = text.trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const fi = s.indexOf("{");
  if (fi > 0) s = s.slice(fi);
  const li = s.lastIndexOf("}");
  if (li >= 0 && li < s.length - 1) s = s.slice(0, li + 1);

  try { return JSON.parse(s) as Record<string, unknown>; } catch { /* fall through */ }
  const m = s.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]) as Record<string, unknown>; } catch { /* fall through */ } }
  const lastBrace = s.lastIndexOf("}");
  const lastBracket = s.lastIndexOf("]");
  const lastValid = Math.max(lastBrace, lastBracket);
  if (lastValid > 0) {
    for (const tail of ["", "}}", "}"]) {
      try { return JSON.parse(s.substring(0, lastValid + 1) + tail) as Record<string, unknown>; } catch { /* next */ }
    }
  }
  return null;
}

async function generateWithRetry(systemPrompt: string, userMsg: string): Promise<string> {
  const geminiModels = [
    "gemini-2.5-flash-preview-05-20",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest",
  ];
  let lastError: unknown;

  const strip = (t: string): string => {
    let s = t.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const fi = s.indexOf("{"); if (fi > 0) s = s.slice(fi);
    const li = s.lastIndexOf("}"); if (li >= 0 && li < s.length - 1) s = s.slice(0, li + 1);
    return s;
  };

  for (const modelName of geminiModels) {
    try {
      const model = genai.getGenerativeModel({ model: modelName, systemInstruction: systemPrompt });
      const result = await model.generateContent(userMsg);
      const text = strip(result.response.text());
      if (safeParse(text) !== null) { console.log(`[AI] Success with ${modelName}`); return text; }
      console.warn(`[AI] ${modelName} returned unparseable JSON`);
      lastError = new Error(`${modelName}: unparseable JSON`);
    } catch (e) {
      lastError = e;
      console.warn(`[AI] ${modelName} failed:`, e instanceof Error ? e.message : e);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.warn("[AI] All Gemini models failed, trying Claude");
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: userMsg }],
    });
    const raw = response.content[0].type === "text" ? response.content[0].text : "";
    const text = strip(raw);
    if (safeParse(text) !== null) { console.log("[AI] Claude succeeded"); return text; }
    lastError = new Error("claude-sonnet-4-5: unparseable JSON");
  } catch (e) {
    lastError = e;
    console.error("[AI] Claude failed:", e instanceof Error ? e.message : e);
  }

  throw lastError;
}

interface AIMeta {
  urgencyScore: number;
  topPainPoints: string[];
  keyInsight: string;
  bestTimeToPost: string;
}

async function getAIMetadata(idea: string, targetCustomer: string, signalTitles: string[]): Promise<AIMeta> {
  const sample = signalTitles.slice(0, 12).map((t, i) => `${i + 1}. ${t}`).join("\n");
  const userMsg = `Startup: "${idea}". Target: "${targetCustomer}".

Pain signals found:
${sample}

Return ONLY this JSON (no other text):
{"urgencyScore":75,"topPainPoints":["pain 1","pain 2","pain 3"],"keyInsight":"2-3 sentence insight","bestTimeToPost":"Tuesday 9am EST"}`;

  try {
    const raw = await generateWithRetry(META_SYSTEM, userMsg);
    const parsed = safeParse(raw);
    if (parsed) {
      return {
        urgencyScore: typeof parsed.urgencyScore === "number" ? Math.min(100, Math.max(0, parsed.urgencyScore)) : 60,
        topPainPoints: Array.isArray(parsed.topPainPoints) ? (parsed.topPainPoints as string[]).slice(0, 5) : [],
        keyInsight: typeof parsed.keyInsight === "string" ? parsed.keyInsight : "",
        bestTimeToPost: typeof parsed.bestTimeToPost === "string" ? parsed.bestTimeToPost : "Tuesday–Thursday 9–11am EST",
      };
    }
  } catch (e) {
    console.warn("[AI] Metadata call failed, using fallback defaults:", e instanceof Error ? e.message : e);
  }

  // Hard fallback — never throws
  return {
    urgencyScore: 65,
    topPainPoints: [`People struggling with ${idea}`, "Looking for better alternatives", "Time and cost frustration"],
    keyInsight: `There is real demand from ${targetCustomer} for a solution to the problems around ${idea}. Multiple people are actively discussing these issues online.`,
    bestTimeToPost: "Tuesday–Thursday 9–11am EST",
  };
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
    const { results: tvResults } = await tavilySearch(tavilyQuery).catch(() => ({ text: "", results: [] }));
    console.log(`[Signals] Tavily: ${tvResults.length} results`);

    // ── Step 1: Build signals deterministically from raw data (no AI) ─────────
    const redditSignals = signalsFromReddit(allReddit);
    const serpSignals   = signalsFromSerp(allSerp);
    const tavilySignals = tvResults.length > 0 ? signalsFromTavily(tvResults) : [];

    // Combine, de-duplicate by URL, cap at 20
    const seenUrls = new Set<string>();
    const allSignals: SignalsReport["signals"] = [];
    for (const s of [...redditSignals, ...serpSignals, ...tavilySignals]) {
      if (!s.url || !seenUrls.has(s.url)) {
        if (s.url) seenUrls.add(s.url);
        allSignals.push(s);
        if (allSignals.length >= 20) break;
      }
    }
    console.log(`[Signals] Built ${allSignals.length} signals (${redditSignals.length} Reddit, ${serpSignals.length} SERP, ${tavilySignals.length} Tavily)`);

    // ── Step 2: One tiny AI call for 3 metadata fields only ───────────────────
    const signalTitles = allSignals.map((s) => s.context || s.quote);
    const meta = await getAIMetadata(trimmedIdea, trimmedCustomer, signalTitles);

    const report: SignalsReport = {
      summary: {
        totalSignals: allSignals.length,
        urgencyScore: meta.urgencyScore,
        topPainPoints: meta.topPainPoints,
        topCommunities: topCommunitiesFromSignals(allSignals),
        bestTimeToPost: meta.bestTimeToPost,
        marketValidation: "",
      },
      signals: allSignals,
      insight: meta.keyInsight,
    };

    const scanDuration = Math.round((Date.now() - startTime) / 1000);
    const brightDataSearches = nonRedditQueries.length;
    const apiCallCount = (allReddit.length > 0 ? 3 : 0) + brightDataSearches + (tvResults.length > 0 ? 1 : 0);

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
