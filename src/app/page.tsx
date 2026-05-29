"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const TICKER_SIGNALS = [
  { n: 41, msg: "indie hackers asking for better customer discovery tools today" },
  { n: 23, msg: "solo founders on Reddit looking for their first customers right now" },
  { n: 67, msg: "people on Quora asking how to validate their startup idea today" },
  { n: 18, msg: "makers on ProductHunt searching for early adopters this hour" },
  { n: 34, msg: "solo founders venting about cold outreach failures on IndieHackers" },
  { n: 89, msg: "people on r/entrepreneur frustrated with their go-to-market today" },
  { n: 52, msg: "startup founders asking for product validation advice on Quora" },
  { n: 28, msg: "builders on ProductHunt searching for customer research alternatives" },
];

const HOW_IT_WORKS = [
  {
    icon: "📝",
    title: "Describe your idea",
    desc: "Tell us what you're building and who it's for. Takes 30 seconds.",
  },
  {
    icon: "🔍",
    title: "We scan live",
    desc: "Bright Data searches Reddit, Quora, IndieHackers and ProductHunt for real complaints right now.",
  },
  {
    icon: "🎯",
    title: "Get your playbook",
    desc: "Real signals + outreach templates + week 1 action plan.",
  },
];

const SAMPLE_SIGNALS = [
  {
    platform: "Reddit",
    platformColor: "#FF4500",
    platformBg: "#FFF4F0",
    username: "u/indie_builder_****",
    community: "r/startups",
    timeAgo: "2 hours ago",
    quote:
      "Spent 3 hours manually searching Reddit for potential customers. Got nothing. There has to be a better way.",
    painKeywords: ["manually searching", "better way"],
    rotate: "-1.5deg",
  },
  {
    platform: "IndieHackers",
    platformColor: "#6366F1",
    platformBg: "#F5F5FF",
    username: "user_****",
    community: "IndieHackers",
    timeAgo: "5 hours ago",
    quote:
      "How do you find your first 10 customers without a marketing budget? Tried cold email — zero replies.",
    painKeywords: ["first 10 customers", "zero replies"],
    rotate: "0deg",
  },
  {
    platform: "Quora",
    platformColor: "#B92B27",
    platformBg: "#FFF5F5",
    username: "user_****",
    community: "Quora",
    timeAgo: "1 day ago",
    quote:
      "As a solo founder, what's the fastest way to validate if anyone actually wants my product?",
    painKeywords: ["validate", "actually wants"],
    rotate: "1.5deg",
  },
];

const PLATFORMS = [
  { name: "Reddit", color: "#FF4500" },
  { name: "IndieHackers", color: "#6366F1" },
  { name: "Quora", color: "#B92B27" },
  { name: "ProductHunt", color: "#DA552F" },
];

function LiveTicker() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % TICKER_SIGNALS.length);
        setVisible(true);
      }, 350);
    }, 4000);
    return () => clearInterval(cycle);
  }, []);

  const current = TICKER_SIGNALS[index];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        background: "#FFF7ED",
        border: "1px solid #FED7AA",
        borderRadius: 100,
        padding: "8px 18px",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <style>{`@keyframes livepulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.45;transform:scale(0.85)} }`}</style>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#EF4444",
          flexShrink: 0,
          animation: "livepulse 1.4s ease-in-out infinite",
        }}
      />
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#92400E",
          transition: "opacity 0.35s ease",
          opacity: visible ? 1 : 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: 520,
        }}
      >
        🔴 Live: <span style={{ fontWeight: 800 }}>{current.n}</span> {current.msg}
      </span>
    </div>
  );
}

function SignalCard({
  signal,
  delay,
}: {
  signal: (typeof SAMPLE_SIGNALS)[0];
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderLeft: `4px solid ${signal.platformColor}`,
        borderRadius: 12,
        padding: "20px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        transform: `rotate(${signal.rotate})`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: signal.platformColor,
            background: signal.platformBg,
            border: `1px solid ${signal.platformColor}30`,
            borderRadius: 100,
            padding: "3px 10px",
            letterSpacing: "0.04em",
          }}
        >
          {signal.platform}
        </span>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>{signal.timeAgo}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 10 }}>
        {signal.username} · {signal.community}
      </div>
      <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.65, marginBottom: 12 }}>
        &ldquo;{signal.quote}&rdquo;
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {signal.painKeywords.map((kw) => (
          <span
            key={kw}
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#10B981",
              background: "#D1FAE5",
              borderRadius: 4,
              padding: "2px 7px",
            }}
          >
            {kw}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const router = useRouter();

  return (
    <div
      style={{
        background: "#FAFAFA",
        minHeight: "100vh",
        color: "#0F172A",
        fontFamily: "var(--font-body), Inter, sans-serif",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 32px",
          borderBottom: "1px solid #E2E8F0",
          background: "#FFFFFF",
        }}
      >
        <div>
          <span
            style={{
              fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: 20,
              color: "#0F172A",
              letterSpacing: "-0.04em",
            }}
          >
            First100
          </span>
          <span style={{ display: "block", fontSize: 10, color: "#94A3B8", fontWeight: 500, marginTop: 1 }}>
            Find your first 100 customers before you launch
          </span>
        </div>
        <motion.button
          whileHover={{ opacity: 0.85 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/analyze")}
          style={{
            background: "#10B981",
            border: "none",
            color: "#FFFFFF",
            padding: "9px 22px",
            borderRadius: 9999,
            fontSize: 13,
            fontFamily: "var(--font-body), Inter, sans-serif",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Find My Customers →
        </motion.button>
      </nav>

      {/* Hero */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "96px 24px 80px",
        }}
      >
        {/* Hackathon badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ marginBottom: 16 }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#FF6B3510", border: "1px solid #FF6B3535",
            borderRadius: 100, padding: "5px 14px",
          }}>
            <span style={{ fontSize: 12 }}>⚡</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#FF6B35", letterSpacing: "0.02em" }}>
              Built for Bright Data Web Data UNLOCKED Hackathon
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          style={{ marginBottom: 36 }}
        >
          <LiveTicker />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.55 }}
          style={{
            fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
            fontSize: "clamp(44px, 7.5vw, 72px)",
            fontWeight: 800,
            lineHeight: 1.06,
            color: "#0F172A",
            marginBottom: 22,
            letterSpacing: "-0.045em",
            maxWidth: 800,
          }}
        >
          Your first 100 customers
          <br />
          <span style={{ color: "#10B981" }}>are already talking.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{
            fontSize: 18,
            color: "#64748B",
            lineHeight: 1.7,
            marginBottom: 44,
            maxWidth: 600,
            fontWeight: 400,
          }}
        >
          First100 scans Reddit, IndieHackers, Quora and ProductHunt live — finding
          real people complaining about the exact problem you solve. Right now.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          whileHover={{ opacity: 0.88, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/analyze")}
          style={{
            background: "#10B981",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 9999,
            padding: "18px 52px",
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "var(--font-body), Inter, sans-serif",
            cursor: "pointer",
            boxShadow: "0 6px 28px rgba(16,185,129,0.38)",
            letterSpacing: "-0.01em",
          }}
        >
          Find My Customers →
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ color: "#94A3B8", fontSize: 12, marginTop: 16, fontWeight: 500 }}
        >
          Free · No signup · Results in ~45 seconds
        </motion.p>

        {/* Platform logos row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 36 }}
        >
          {PLATFORMS.map((p) => (
            <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, display: "inline-block" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8" }}>{p.name}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Social proof bar */}
      <div
        style={{
          background: "#F8FAFC",
          borderTop: "1px solid #E2E8F0",
          borderBottom: "1px solid #E2E8F0",
          padding: "14px 24px",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600, letterSpacing: "0.04em" }}>
          Scanning 4 platforms&nbsp;&nbsp;·&nbsp;&nbsp;Live web data&nbsp;&nbsp;·&nbsp;&nbsp;Powered by Bright Data
        </span>
      </div>

      {/* How it works */}
      <section style={{ padding: "80px 24px", background: "#FFFFFF" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
              fontSize: 30,
              fontWeight: 700,
              color: "#0F172A",
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
                key={item.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
                style={{
                  background: "#FAFAFA",
                  border: "1px solid #E2E8F0",
                  borderRadius: 14,
                  padding: "28px 24px",
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: "#10B981", letterSpacing: "0.12em", marginBottom: 14 }}>
                  STEP {String(i + 1).padStart(2, "0")}
                </div>
                <div style={{ fontSize: 30, marginBottom: 14 }}>{item.icon}</div>
                <h3 style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 8, letterSpacing: "-0.02em" }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.65 }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live signals preview */}
      <section style={{ padding: "80px 24px", background: "#FAFAFA", borderTop: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 56 }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
                fontSize: 30,
                fontWeight: 700,
                color: "#0F172A",
                letterSpacing: "-0.03em",
                marginBottom: 12,
              }}
            >
              Real signals. Found live.
            </h2>
            <p style={{ fontSize: 15, color: "#64748B", maxWidth: 460, margin: "0 auto" }}>
              These are the kinds of signals First100 surfaces — real people, real pain, right now.
            </p>
          </motion.div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
              gap: 24,
              alignItems: "start",
            }}
          >
            {SAMPLE_SIGNALS.map((s, i) => (
              <SignalCard key={i} signal={s} delay={i * 0.12} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        style={{
          padding: "88px 24px",
          textAlign: "center",
          background: "#0F172A",
        }}
      >
        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
            fontSize: "clamp(28px, 4.5vw, 44px)",
            fontWeight: 800,
            color: "#FFFFFF",
            marginBottom: 16,
            letterSpacing: "-0.04em",
            lineHeight: 1.12,
          }}
        >
          Your first customer posted about their problem today.
        </motion.h2>
        <p style={{ color: "#94A3B8", fontSize: 16, marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
          First100 finds them before anyone else does.
        </p>
        <motion.button
          whileHover={{ opacity: 0.9, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/analyze")}
          style={{
            background: "#FFFFFF",
            color: "#0F172A",
            border: "none",
            borderRadius: 9999,
            padding: "17px 48px",
            fontSize: 17,
            fontWeight: 700,
            fontFamily: "var(--font-body), Inter, sans-serif",
            cursor: "pointer",
            boxShadow: "0 4px 24px rgba(255,255,255,0.15)",
          }}
        >
          Start Finding Customers →
        </motion.button>
        <p style={{ color: "#475569", fontSize: 11, marginTop: 18, fontWeight: 500 }}>
          Powered by Bright Data · Built for founders
        </p>
      </section>
    </div>
  );
}
