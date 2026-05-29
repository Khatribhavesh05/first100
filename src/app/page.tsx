"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: "🔍",
    title: "Describe your idea",
    desc: "Tell us what you're building and who it's for. Takes 30 seconds.",
  },
  {
    step: "02",
    icon: "🌐",
    title: "Live web scan",
    desc: "We scrape ProductHunt, G2, Capterra and competitor homepages in real-time.",
  },
  {
    step: "03",
    icon: "📊",
    title: "Get your intelligence",
    desc: "Receive a full competitive analysis + a GTM strategy ready to execute.",
  },
];

const FEATURES = [
  {
    icon: "⚡",
    title: "Live Web Data",
    desc: "Bright Data powers real-time scraping of 10,000+ data sources — no stale databases.",
    color: "#6366F1",
  },
  {
    icon: "🎯",
    title: "Competitor Deep Dives",
    desc: "Pricing, weaknesses, target customers, and strategic gaps — scraped directly from their sites.",
    color: "#10B981",
  },
  {
    icon: "🗺️",
    title: "GTM Strategy",
    desc: "Positioning, ICP, acquisition channels, pricing tiers, and a 3-phase roadmap.",
    color: "#F59E0B",
  },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div
      style={{
        background: "#0A0A0A",
        minHeight: "100vh",
        color: "#FFFFFF",
        position: "relative",
        fontFamily: "var(--font-body), Inter, sans-serif",
      }}
    >
      {/* Grain texture */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />

      {/* Indigo glow from top */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: "radial-gradient(ellipse 70% 35% at 50% 0%, rgba(99,102,241,0.10), transparent 60%)",
        }}
      />

      {/* Nav */}
      <nav
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 32px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "#6366F1",
            letterSpacing: "-0.04em",
          }}
        >
          FounderScope
        </span>
        <motion.button
          whileHover={{ opacity: 0.8 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/analyze")}
          style={{
            background: "transparent",
            border: "1px solid #2A2A2A",
            color: "#888888",
            padding: "8px 16px",
            borderRadius: 6,
            fontSize: 13,
            fontFamily: "var(--font-body), Inter, sans-serif",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Get Started →
        </motion.button>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "100px 24px 80px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: 28 }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid #2A2A2A",
              borderRadius: 100,
              padding: "6px 16px",
              fontSize: 12,
              color: "#888888",
              fontWeight: 500,
              letterSpacing: "0.02em",
            }}
          >
            <span style={{ color: "#6366F1" }}>◎</span>
            Powered by Bright Data + Gemini 2.5
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.55 }}
          style={{
            fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
            fontSize: "clamp(44px, 8vw, 76px)",
            fontWeight: 800,
            lineHeight: 1.06,
            color: "#FFFFFF",
            marginBottom: 20,
            letterSpacing: "-0.04em",
            maxWidth: 760,
          }}
        >
          Know your market<br />
          <span style={{ color: "#6366F1" }}>before you build.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{
            fontSize: 18,
            color: "#888888",
            lineHeight: 1.65,
            marginBottom: 44,
            maxWidth: 560,
            fontWeight: 400,
          }}
        >
          Enter your startup idea → FounderScope maps your competition and builds your GTM strategy using live web data.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          whileHover={{ opacity: 0.88, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/analyze")}
          style={{
            background: "#6366F1",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 8,
            padding: "16px 40px",
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "var(--font-body), Inter, sans-serif",
            cursor: "pointer",
            boxShadow: "0 0 48px rgba(99,102,241,0.35)",
            letterSpacing: "-0.01em",
          }}
        >
          Analyze My Market →
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ color: "#444444", fontSize: 12, marginTop: 16, fontWeight: 500 }}
        >
          Free · No signup required · Results in ~60 seconds
        </motion.p>
      </section>

      {/* ── How It Works ── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          borderTop: "1px solid #1A1A1A",
          padding: "80px 24px",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
              fontSize: 30,
              fontWeight: 700,
              color: "#FFFFFF",
              textAlign: "center",
              marginBottom: 56,
              letterSpacing: "-0.03em",
            }}
          >
            How it works
          </motion.h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 24,
            }}
          >
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
                style={{
                  background: "#0E0E0E",
                  border: "1px solid #1A1A1A",
                  borderRadius: 12,
                  padding: "28px 24px",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#6366F1",
                    letterSpacing: "0.12em",
                    marginBottom: 16,
                    fontFamily: "var(--font-body), Inter, sans-serif",
                  }}
                >
                  STEP {item.step}
                </div>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
                <h3
                  style={{
                    fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#F5F5F5",
                    marginBottom: 8,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ fontSize: 13, color: "#888888", lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          borderTop: "1px solid #1A1A1A",
          padding: "80px 24px",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
              fontSize: 30,
              fontWeight: 700,
              color: "#FFFFFF",
              textAlign: "center",
              marginBottom: 56,
              letterSpacing: "-0.03em",
            }}
          >
            Everything you need to validate fast
          </motion.h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 20,
            }}
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                style={{
                  background: "rgba(17,17,17,0.8)",
                  border: `1px solid ${f.color}20`,
                  borderRadius: 12,
                  padding: "28px 24px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, ${f.color}60, transparent)`,
                  }}
                />
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    background: `${f.color}14`,
                    border: `1px solid ${f.color}30`,
                    marginBottom: 16,
                  }}
                >
                  {f.icon}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#F5F5F5",
                    marginBottom: 8,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontSize: 13, color: "#888888", lineHeight: 1.65 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Powered By ── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          borderTop: "1px solid #1A1A1A",
          padding: "48px 24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 11, color: "#444444", fontWeight: 600, letterSpacing: "0.1em", marginBottom: 20 }}>
          POWERED BY
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
          {[
            { name: "Bright Data", sub: "Live web scraping" },
            { name: "Gemini 2.5 Flash", sub: "AI analysis" },
          ].map((p) => (
            <div
              key={p.name}
              style={{
                border: "1px solid #2A2A2A",
                borderRadius: 8,
                padding: "12px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  color: "#F5F5F5",
                  marginBottom: 2,
                }}
              >
                {p.name}
              </div>
              <div style={{ fontSize: 11, color: "#555555" }}>{p.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          borderTop: "1px solid #1A1A1A",
          padding: "80px 24px",
          textAlign: "center",
          background: "radial-gradient(ellipse 50% 60% at 50% 100%, rgba(99,102,241,0.07), transparent 70%)",
        }}
      >
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
            fontSize: "clamp(28px, 5vw, 44px)",
            fontWeight: 800,
            color: "#FFFFFF",
            marginBottom: 16,
            letterSpacing: "-0.04em",
          }}
        >
          Stop guessing. Start knowing.
        </motion.h2>
        <p style={{ color: "#666666", fontSize: 15, marginBottom: 36 }}>
          Your competitors are already live. See exactly how to beat them.
        </p>
        <motion.button
          whileHover={{ opacity: 0.88, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/analyze")}
          style={{
            background: "#FFFFFF",
            color: "#000000",
            border: "none",
            borderRadius: 8,
            padding: "14px 36px",
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "var(--font-body), Inter, sans-serif",
            cursor: "pointer",
          }}
        >
          Analyze My Market →
        </motion.button>
      </section>
    </div>
  );
}
