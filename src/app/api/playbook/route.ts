import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import { type NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

const genai = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlaybookReport {
  positioning: {
    oneLiner: string;
    uniqueAngle: string;
    messagingHook: string;
  };
  idealCustomer: {
    description: string;
    whereLive: string;
    currentPain: string;
    triggerMoment: string;
  };
  outreachTemplates: Array<{
    channel: string;
    community?: string;
    subject?: string;
    body?: string;
    bestTime?: string;
    triggerPost?: string;
    message?: string;
  }>;
  weekOnePlan: Array<{
    day: string;
    actions: string[];
    goal: string;
    timeRequired: string;
  }>;
  milestones: {
    week1: string;
    week2: string;
    month1: string;
  };
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a customer acquisition strategist helping a founder build their first-100-customers playbook.
You have real signal data showing where potential customers are and what they need.
CRITICAL: All positioning statements, one-liners, and messaging must reference the founder's STARTUP IDEA (provided as "STARTUP IDEA:" in the prompt), NOT "First100" (which is the name of this discovery tool, not their product).
Build a complete first-100-customers playbook.

Output a single valid JSON object only. No markdown. No backticks. Start with { end with }.

{
  "positioning": {
    "oneLiner": "single sentence positioning statement",
    "uniqueAngle": "what makes this different",
    "messagingHook": "the exact hook that will resonate based on the pain signals"
  },
  "idealCustomer": {
    "description": "specific person description",
    "whereLive": "exact communities from signal data",
    "currentPain": "their exact pain in their own words based on signals",
    "triggerMoment": "the exact moment they would search for this solution"
  },
  "outreachTemplates": [
    {
      "channel": "Reddit Post",
      "community": "exact subreddit",
      "subject": "exact post title",
      "body": "exact post body — 150 words max, conversational, not salesy",
      "bestTime": "when to post"
    },
    {
      "channel": "Reddit DM",
      "triggerPost": "what post to respond to",
      "message": "exact DM — 50 words max, helpful not pitchy"
    },
    {
      "channel": "Cold Email",
      "subject": "exact subject line",
      "body": "exact email body — 100 words max"
    }
  ],
  "weekOnePlan": [
    {
      "day": "Day 1",
      "actions": ["specific action 1", "specific action 2"],
      "goal": "exact outcome",
      "timeRequired": "X hours"
    },
    { "day": "Day 2", "actions": ["specific action 1", "specific action 2"], "goal": "exact outcome", "timeRequired": "X hours" },
    { "day": "Day 3", "actions": ["specific action 1", "specific action 2"], "goal": "exact outcome", "timeRequired": "X hours" },
    { "day": "Day 4", "actions": ["specific action 1", "specific action 2"], "goal": "exact outcome", "timeRequired": "X hours" },
    { "day": "Day 5", "actions": ["specific action 1", "specific action 2"], "goal": "exact outcome", "timeRequired": "X hours" }
  ],
  "milestones": {
    "week1": "exact target",
    "week2": "exact target",
    "month1": "exact target — first paying customer"
  }
}`;

// ── generateWithRetry ────────────────────────────────────────────────────────

async function generateWithRetry(
  systemPrompt: string,
  userMsg: string
): Promise<string> {
  const geminiModels = [
    "gemini-2.5-flash-preview-05-20",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest",
  ];
  let lastError: unknown;

  const strip = (t: string) =>
    t.trim().replace(/^```json\n?/i, "").replace(/^```\n?/i, "").replace(/```\n?$/i, "").trim();

  for (const modelName of geminiModels) {
    try {
      const model = genai.getGenerativeModel({ model: modelName, systemInstruction: systemPrompt });
      const result = await model.generateContent(userMsg);
      console.log(`[AI] Success with ${modelName}`);
      return strip(result.response.text());
    } catch (e) {
      lastError = e;
      console.warn(`[AI] ${modelName} failed:`, e instanceof Error ? e.message : e);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Final fallback: Claude claude-sonnet-4-20250514
  console.warn("[AI] All Gemini models failed, trying Claude fallback");
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userMsg }],
    });
    const text = response.content[0].type === "text" ? response.content[0].text : "";
    console.log("[AI] Claude fallback succeeded");
    return strip(text);
  } catch (e) {
    lastError = e;
    console.error("[AI] Claude fallback failed:", e instanceof Error ? e.message : e);
  }

  throw lastError;
}

// ── safeParse ─────────────────────────────────────────────────────────────────

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

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      idea?: string;
      targetCustomer?: string;
      geography?: string;
      signalsData?: unknown;
    };

    const { idea, targetCustomer, geography = "Global", signalsData } = body;

    if (!idea || typeof idea !== "string" || idea.trim().length < 5) {
      return NextResponse.json({ error: "idea is required (min 5 chars)." }, { status: 400 });
    }
    if (!targetCustomer || typeof targetCustomer !== "string") {
      return NextResponse.json({ error: "targetCustomer is required." }, { status: 400 });
    }

    const userMsg = `Build a complete first-100-customers playbook for this startup.
Output JSON only. No markdown. Start with { and end with }.

STARTUP IDEA: ${idea.trim()}
TARGET CUSTOMER: ${targetCustomer.trim()}
GEOGRAPHY: ${geography}

${signalsData ? `LIVE SIGNAL DATA:\n${JSON.stringify(signalsData, null, 2)}` : "No signal data provided — use your knowledge to build the playbook."}`;

    const text = await generateWithRetry(SYSTEM_PROMPT, userMsg);
    const parsed = safeParse(text);
    if (!parsed) throw new Error("Failed to parse Gemini response as JSON.");
    const playbook = parsed as unknown as PlaybookReport;

    return NextResponse.json({ success: true, data: playbook });
  } catch (err) {
    console.error("[Playbook] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Playbook generation failed: ${message}` }, { status: 500 });
  }
}
