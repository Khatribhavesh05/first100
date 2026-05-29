# First100 — Find Your First 100 Customers Before You Launch

![First100 Banner](https://first100-beta.vercel.app/og-image.png)

> **Your first 100 customers are already talking. First100 finds them.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-first100--beta.vercel.app-green?style=for-the-badge)](https://first100-beta.vercel.app)
[![Built with Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Powered by Bright Data](https://img.shields.io/badge/Powered%20by-Bright%20Data-orange?style=for-the-badge)](https://brightdata.com)
[![Hackathon](https://img.shields.io/badge/Web%20Data%20UNLOCKED-Hackathon%202026-blue?style=for-the-badge)](https://lablab.ai/ai-hackathons/brightdata-ai-agents-web-data-hackathon)

---

## 🎯 What is First100?

Most founders spend months building — then discover nobody wants it.

**First100 flips the script.** Before you write a single line of code, First100 finds real people already complaining about the exact problem you're solving — right now, on Reddit, IndieHackers, Quora and ProductHunt.

Enter your startup idea → get real signals from real people → generate a complete GTM outreach playbook in **45 seconds**.

---

## ✨ Features

- **🔍 Live Signal Discovery** — 60+ parallel Bright Data SERP searches across 4 platforms simultaneously
- **👤 Real People, Real Posts** — Every signal card shows real usernames, real quotes, real links
- **🔴 "Reach them →"** — Click any card to open the actual live post instantly
- **📊 Urgency Score** — AI-powered 0-100 score showing how acute the pain is
- **🏘️ Top Communities** — Ranked list of where your customers are most active
- **📋 GTM Playbook** — Complete outreach strategy generated from real signal data
- **📧 Outreach Templates** — Reddit post, Reddit DM, and cold email templates ready to use
- **📅 Week 1 Action Plan** — Day-by-day execution roadmap
- **📄 PDF Export** — Download your full playbook as a PDF instantly
- **⚡ No signup required** — Free, instant results in 45 seconds

---

## 🚀 Live Demo

**[first100-beta.vercel.app](https://first100-beta.vercel.app)**

Try it with any startup idea:
1. Describe what you're building
2. Define your target customer
3. Select geography (US / Global / India)
4. Click **Find My First 100 Customers →**

---

## 🏗️ How It Works

```
Founder enters idea
        ↓
Bright Data SERP API fires 60+ parallel searches
        ↓
Reddit API fetches real posts with real usernames
        ↓
Gemini 2.5 Flash synthesizes signal cards
        ↓
Real quotes + real links + urgency scoring
        ↓
Generate GTM Playbook → Export PDF
```

### Pages

| Page | Description |
|------|-------------|
| `/` | Landing page with live ticker and signal preview |
| `/analyze` | Input form — idea, target customer, geography |
| `/results` | Signal cards with real Reddit/IH/Quora/PH posts |
| `/playbook` | Complete GTM outreach playbook + PDF export |

### API Routes

| Route | Description |
|-------|-------------|
| `/api/signals` | Bright Data SERP API + Reddit API + Gemini synthesis |
| `/api/playbook` | Gemini GTM strategy generation |

---

## ⚡ Bright Data Integration

First100 is powered entirely by **Bright Data SERP API**.

Every scan fires **60+ queries** through Bright Data's infrastructure:
- Bypasses bot detection on Reddit, IndieHackers, Quora, ProductHunt
- Handles JavaScript-rendered pages
- Returns live, real-time results (not cached)
- Geo-targeted results based on founder's market

Without Bright Data, this product doesn't exist.

```typescript
// Example Bright Data SERP API call
const response = await fetch('https://api.brightdata.com/serp/google', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.BRIGHT_DATA_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: `site:reddit.com "${idea}" problem`,
    zone: 'serp_api1',
  })
});
```

---

## 🛠️ Tech Stack

| Technology | Usage |
|------------|-------|
| **Bright Data SERP API** | Core data layer — 60+ parallel searches |
| **Reddit API** | Real post fetching with usernames |
| **Gemini 2.5 Flash** | Signal synthesis + playbook generation |
| **Claude Sonnet** | AI fallback layer |
| **Next.js 14** | Full-stack React framework |
| **Tailwind CSS** | Styling |
| **Shadcn UI** | Component library |
| **Framer Motion** | Animations |
| **jsPDF** | PDF export |
| **Vercel** | Deployment |

---

## 🏃 Running Locally

### Prerequisites
- Node.js 18+
- Bright Data account with SERP API zone (`serp_api1`)
- Google AI API key (Gemini)

### Setup

```bash
# Clone the repo
git clone https://github.com/Khatribhavesh05/first100
cd first100

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Environment Variables

```env
BRIGHT_DATA_API_KEY=your_bright_data_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
GEMINI_API_KEY=your_gemini_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
TAVILY_API_KEY=your_tavily_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
first100/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Landing page
│   │   ├── analyze/
│   │   │   └── page.tsx      # Input form + scanning animation
│   │   ├── results/
│   │   │   └── page.tsx      # Signal cards
│   │   ├── playbook/
│   │   │   └── page.tsx      # GTM playbook + PDF export
│   │   └── api/
│   │       ├── signals/
│   │       │   └── route.ts  # Bright Data + Reddit + Gemini
│   │       └── playbook/
│   │           └── route.ts  # Playbook generation
│   └── components/
├── public/
├── package.json
└── README.md
```

---

## 🎯 Why First100 Wins

| What judges care about | First100 |
|------------------------|----------|
| Real Bright Data usage | ✅ 60+ live SERP calls per scan |
| Actually works | ✅ Full end-to-end flow |
| Real data (not mocked) | ✅ Real usernames, real links |
| Actionable output | ✅ Playbook + templates + PDF |
| No signup friction | ✅ Instant, free |
| Pure GTM focus | ✅ Built for founders |

---

## 🏆 Hackathon

Built for the **[Web Data UNLOCKED Hackathon](https://lablab.ai/ai-hackathons/brightdata-ai-agents-web-data-hackathon)** by Bright Data × lablab.ai

- **Track:** GTM Intelligence
- **Prize:** $700 Online Winner
- **Team:** Qrew

---

## 👤 Builder

**Bhavesh Khatri** — B.Tech AI/ML @ JIET Jodhpur  
Solo founder. Built in 5 days.

[![GitHub](https://img.shields.io/badge/GitHub-Khatribhavesh05-black?style=flat&logo=github)](https://github.com/Khatribhavesh05)

---

## 📄 License

MIT License — feel free to use and build on this.

---

<div align="center">
  <strong>Built for founders, by a founder.</strong><br>
  <a href="https://first100-beta.vercel.app">Try First100 →</a>
</div>
