import { GoogleGenerativeAI } from "@google/generative-ai";
import { type NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StrategyReport {
  positioning: {
    uniqueAngle: string;
    tagline: string;
    valueProposition: string;
    category: string;
  };
  idealCustomerProfile: {
    description: string;
    painPoints: string[];
    willingnessToPay: string;
    whereToFind: string[];
    currentSolution: string;
  };
  gtmPhases: Array<{
    phase: number;
    timeline: string;
    goal: string;
    actions: string[];
    budget: string;
    successMetric: string;
  }>;
  pricing: {
    model: string;
    rationale: string;
    tiers: Array<{
      name: string;
      price: string;
      features: string[];
      targetUser: string;
      conversionRole: string;
    }>;
  };
  competitiveAdvantage: {
    moat: string;
    unfairEdge: string;
    timeline: string;
  };
  topActions: string[];
  mandate: string;
  revenueProjections: {
    month1: { users: number; revenue: string; assumption: string };
    month3: { users: number; revenue: string; assumption: string };
    month6: { users: number; revenue: string; assumption: string };
    month12: { users: number; revenue: string; assumption: string };
  };
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a brutally honest GTM strategist for FounderScope.
You have market research data. Build a complete go-to-market strategy.

Output a single valid JSON object only. No markdown. No backticks. Start with { end with }.

{
  "positioning": {
    "uniqueAngle": "what makes this startup different in one sentence",
    "tagline": "punchy 6-8 word tagline",
    "valueProposition": "exactly who you help, what problem, how differently than anyone else",
    "category": "the specific category this startup owns"
  },
  "idealCustomerProfile": {
    "description": "specific person — job title, company size, situation",
    "painPoints": ["specific pain 1 with evidence", "specific pain 2", "specific pain 3"],
    "willingnessToPay": "$XX/month — with reasoning",
    "whereToFind": ["exact subreddit r/...", "exact community name", "exact platform + search term"],
    "currentSolution": "what they use today and why it fails them"
  },
  "gtmPhases": [
    {
      "phase": 1,
      "timeline": "Days 1-30",
      "goal": "First 10 paying users",
      "actions": [
        "Exact subreddit + exact post type + exact hook",
        "Exact type of person to DM + exact opening line",
        "Exact content angle + platform + format",
        "Exact community + exact value-add approach"
      ],
      "budget": "$0",
      "successMetric": "exact number defining success"
    },
    {
      "phase": 2,
      "timeline": "Days 31-60",
      "goal": "100 users",
      "actions": ["specific action 1", "specific action 2", "specific action 3"],
      "budget": "$XX",
      "successMetric": "exact number"
    },
    {
      "phase": 3,
      "timeline": "Days 61-90",
      "goal": "First $1000 MRR",
      "actions": ["specific action 1", "specific action 2", "specific action 3"],
      "budget": "$XX",
      "successMetric": "exact number"
    }
  ],
  "pricing": {
    "model": "subscription | usage-based | one-time",
    "rationale": "why this model fits this specific market",
    "tiers": [
      {
        "name": "tier name",
        "price": "$XX/month",
        "features": ["feature 1", "feature 2", "feature 3"],
        "targetUser": "specific person this tier is for",
        "conversionRole": "role in funnel — acquisition | monetization | expansion"
      }
    ]
  },
  "competitiveAdvantage": {
    "moat": "what makes this defensible long term",
    "unfairEdge": "specific advantage competitors cannot easily copy",
    "timeline": "when this becomes truly defensible"
  },
  "topActions": [
    "Immediate action 1 — specific platform + specific action + specific target",
    "Immediate action 2",
    "Immediate action 3",
    "Immediate action 4",
    "Immediate action 5"
  ],
  "mandate": "150 words max. Direct advice to founder using you. First: connect top market finding to top strategic recommendation. Second: connect biggest competitor weakness to your entry point. End with ONE specific action doable in next 24 hours naming exact platform and exact action.",
  "revenueProjections": {
    "month1": { "users": 0, "revenue": "$0", "assumption": "string" },
    "month3": { "users": 0, "revenue": "$0", "assumption": "string" },
    "month6": { "users": 0, "revenue": "$0", "assumption": "string" },
    "month12": { "users": 0, "revenue": "$0", "assumption": "string" }
  }
}`;

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      idea?: string;
      targetMarket?: string;
      researchData?: unknown;
    };

    const { idea, targetMarket, researchData } = body;

    if (!idea || typeof idea !== "string" || idea.trim().length < 5) {
      return NextResponse.json({ error: "idea is required (min 5 chars)." }, { status: 400 });
    }
    if (!targetMarket || typeof targetMarket !== "string") {
      return NextResponse.json({ error: "targetMarket is required." }, { status: 400 });
    }

    const model = genai.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const userMsg = `Build a full GTM strategy for this startup.
Output the JSON only. No markdown. No explanation. Start with { and end with }.

STARTUP IDEA: ${idea.trim()}
TARGET MARKET: ${targetMarket.trim()}

${researchData ? `MARKET RESEARCH DATA:\n${JSON.stringify(researchData, null, 2)}` : "No research data provided — use your knowledge of this market."}`;

    const result = await model.generateContent(userMsg);
    const raw = result.response.text().trim()
      .replace(/^```json\n?/i, "")
      .replace(/^```\n?/i, "")
      .replace(/```\n?$/i, "")
      .trim();

    const strategy = JSON.parse(raw) as StrategyReport;

    return NextResponse.json({ success: true, data: strategy });
  } catch (err) {
    console.error("[Strategy] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Strategy generation failed: ${message}` }, { status: 500 });
  }
}
