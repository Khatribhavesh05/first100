"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { SignalsReport } from "@/app/api/signals/route";

const PLATFORM_STYLES: Record<string, { color: string; bg: string; emoji: string }> = {
  Reddit: { color: "#FF4500", bg: "#FF450014", emoji: "🔴" },
  IndieHackers: { color: "#6366F1", bg: "#6366F114", emoji: "🟣" },
  ProductHunt: { color: "#DA552F", bg: "#DA552F14", emoji: "🟠" },
  Quora: { color: "#B92B27", bg: "#B92B2714", emoji: "🔵" },
  Web: { color: "#64748B", bg: "#64748B14", emoji: "🌐" },
};

const GEO_MAP: Record<string, { flag: string; code: string }> = {
  US: { flag: "🇺🇸", code: "US" },
  India: { flag: "🇮🇳", code: "IN" },
  Global: { flag: "🌍", code: "Global" },
  Other: { flag: "🌐", code: "Intl" },
};

const REACH_STYLES = {
  easy: { color: "#10B981", bg: "#D1FAE5", emoji: "🟢" },
  medium: { color: "#D97706", bg: "#FEF3C7", emoji: "🟡" },
  hard: { color: "#EF4444", bg: "#FEE2E2", emoji: "🔴" },
};

const ALLOWED_DOMAINS = ["reddit.com", "indiehackers.com", "producthunt.com", "quora.com"];
const ALLOWED_PLATFORMS = ["Reddit", "IndieHackers", "ProductHunt", "Quora"];

function platformFromUrl(url: string, fallback: string): string {
  if (!url) return fallback;
  const u = url.toLowerCase();
  if (u.includes("reddit.com")) return "Reddit";
  if (u.includes("indiehackers.com")) return "IndieHackers";
  if (u.includes("producthunt.com")) return "ProductHunt";
  if (u.includes("quora.com")) return "Quora";
  return fallback;
}

type Signal = SignalsReport["signals"][number];

function isAllowedSignal(signal: Signal): boolean {
  if (signal.url) {
    for (const domain of ALLOWED_DOMAINS) {
      if (signal.url.includes(domain)) return true;
    }
  }
  if (ALLOWED_PLATFORMS.includes(signal.platform)) return true;
  if (!signal.url && signal.quote) return true;
  return false;
}

function filterSignals(signals: Signal[]): Signal[] {
  const filtered = signals.filter(isAllowedSignal);
  return filtered.length >= 5 ? filtered : signals;
}

const ACTIVITY_COLORS: Record<string, string> = {
  high: "#10B981",
  medium: "#F59E0B",
  low: "#94A3B8",
};

function LoadingDots({ color = "#FFFFFF" }: { color?: string }) {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: color }}
        />
      ))}
    </span>
  );
}

function highlightKeywords(quote: string, keywords: string[]): React.ReactNode {
  if (!keywords.length) return quote;
  const pattern = new RegExp(`(${keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = quote.split(pattern);
  return parts.map((part, i) =>
    pattern.test(part) ? (
      <mark key={i} style={{ background: "#D1FAE5", color: "#065F46", borderRadius: 3, padding: "0 2px", fontWeight: 600 }}>
        {part}
      </mark>
    ) : part
  );
}

function formatUsername(username: string, platform: string, url?: string): string {
  const resolved = platformFromUrl(url ?? "", platform);
  if (!username || username === "Anonymous" || /^web_/.test(username) || username === "unknown") {
    if (resolved === "IndieHackers") return "IH Member";
    if (resolved === "Quora") return "Quora User";
    if (resolved === "ProductHunt") return "PH User";
    if (resolved === "Reddit") return "u/redditor";
    return "Community Member";
  }
  return username;
}

function PlatformBadge({ platform, url }: { platform: string; url?: string }) {
  const resolved = platformFromUrl(url ?? "", platform);
  const styles = PLATFORM_STYLES[resolved] ?? { color: "#64748B", bg: "#64748B14", emoji: "🌐" };
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: styles.color,
        background: styles.bg,
        border: `1px solid ${styles.color}30`,
        borderRadius: 100,
        padding: "3px 9px",
        letterSpacing: "0.04em",
        flexShrink: 0,
      }}
    >
      {styles.emoji} {resolved}
    </span>
  );
}

function platformBorderColor(platform: string, url?: string): string {
  const resolved = platformFromUrl(url ?? "", platform);
  return PLATFORM_STYLES[resolved]?.color ?? "#E2E8F0";
}

function GeoTag({ geography }: { geography: string }) {
  const geo = GEO_MAP[geography] ?? { flag: "🌍", code: geography };
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: "#475569",
        background: "#F1F5F9",
        border: "1px solid #E2E8F0",
        borderRadius: 4,
        padding: "2px 7px",
      }}
    >
      {geo.flag} {geo.code}
    </span>
  );
}

interface ScanMeta { apiCallCount: number; scanDuration: number; brightDataSearches: number; }

export default function ResultsPage() {
  const router = useRouter();
  const [report, setReport] = useState<SignalsReport | null>(null);
  const [idea, setIdea] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [geography, setGeography] = useState("");
  const [scanMeta, setScanMeta] = useState<ScanMeta | null>(null);
  const [generatingPlaybook, setGeneratingPlaybook] = useState(false);
  const [playbookError, setPlaybookError] = useState<string | null>(null);

  useEffect(() => {
    // Try primary key first, fall back to redundant key for robust back-nav
    const raw = localStorage.getItem("f1_signals") ?? localStorage.getItem("f1_results_data");
    const metaRaw = localStorage.getItem("f1_scan_meta");
    const inputRaw = localStorage.getItem("f1_scan_input");

    if (inputRaw) {
      try {
        const input = JSON.parse(inputRaw) as { idea?: string; targetCustomer?: string; geography?: string };
        setIdea(input.idea ?? "");
        setTargetCustomer(input.targetCustomer ?? "");
        setGeography(input.geography ?? "Global");
      } catch { /* ignore */ }
    } else {
      setIdea(localStorage.getItem("f1_idea") ?? "");
      setTargetCustomer(localStorage.getItem("f1_targetCustomer") ?? "");
      setGeography(localStorage.getItem("f1_geography") ?? "Global");
    }

    if (raw) {
      try { setReport(JSON.parse(raw) as SignalsReport); } catch { /* ignore */ }
    }
    if (metaRaw) {
      try { setScanMeta(JSON.parse(metaRaw) as ScanMeta); } catch { /* ignore */ }
    }
  }, []);

  const handleNewScan = () => {
    // Clear all scan data so /analyze starts fresh
    ["f1_idea", "f1_targetCustomer", "f1_geography", "f1_signals", "f1_results_data", "f1_scan_input", "f1_scan_meta", "f1_playbook", "f1_playbook_data"].forEach((k) => localStorage.removeItem(k));
    router.push("/analyze");
  };

  const handleGeneratePlaybook = async () => {
    // If a playbook was already generated for this scan, navigate directly
    const existing = localStorage.getItem("f1_playbook_data");
    if (existing) {
      router.push("/playbook");
      return;
    }

    setGeneratingPlaybook(true);
    setPlaybookError(null);
    try {
      const res = await fetch("/api/playbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, targetCustomer, geography, signalsData: report }),
      });
      const data = await res.json() as { success?: boolean; data?: unknown; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error ?? "Playbook generation failed.");
      // Save to both keys for robust back-navigation
      localStorage.setItem("f1_playbook", JSON.stringify(data.data));
      localStorage.setItem("f1_playbook_data", JSON.stringify(data.data));
      router.push("/playbook");
    } catch (err) {
      setPlaybookError(err instanceof Error ? err.message : "Something went wrong.");
      setGeneratingPlaybook(false);
    }
  };

  if (!report) {
    return (
      <div style={{ background: "#FAFAFA", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-body), Inter, sans-serif", gap: 16 }}>
        <div style={{ fontSize: 36, color: "#10B981" }}>◎</div>
        <p style={{ color: "#64748B", fontSize: 14 }}>No results found.</p>
        <button onClick={() => router.push("/analyze")} style={{ background: "#10B981", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Run Scan →
        </button>
      </div>
    );
  }

  const { summary, signals, insight } = report;
  const filteredSignals = filterSignals(signals);

  // Per-platform counts for scan summary
  const platformCounts = filteredSignals.reduce((acc, s) => {
    const p = platformFromUrl(s.url ?? "", s.platform);
    if (ALLOWED_PLATFORMS.includes(p)) {
      acc[p] = (acc[p] ?? 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ background: "#FAFAFA", minHeight: "100vh", color: "#0F172A", fontFamily: "var(--font-body), Inter, sans-serif" }}>
      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "16px 32px",
        borderBottom: "1px solid #E2E8F0", background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
      }}>
        <button onClick={() => router.push("/")} style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 17, color: "#10B981", letterSpacing: "-0.04em", background: "transparent", border: "none", cursor: "pointer" }}>
          First100
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleNewScan}
            style={{ background: "transparent", border: "1px solid #E2E8F0", color: "#64748B", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body), Inter, sans-serif" }}
          >
            🔄 New Scan
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {[{ label: "Signals", done: true }, { label: "Playbook", done: false }].map((s, i) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: s.done ? "#10B981" : "#94A3B8" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: s.done ? "#D1FAE5" : "#F1F5F9", border: `2px solid ${s.done ? "#10B981" : "#E2E8F0"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: s.done ? "#10B981" : "#94A3B8", fontWeight: 700 }}>
                  {s.done ? "✓" : i + 1}
                </div>
                <span>{s.label}</span>
              </div>
              {i < 1 && <div style={{ width: 24, height: 1, background: "#E2E8F0" }} />}
            </div>
          ))}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 96px" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
            <style>{`@keyframes livepulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.8)}}`}</style>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10B981", display: "inline-block", flexShrink: 0, animation: "livepulse 1.4s ease-in-out infinite" }} />
            <h1 style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.04em" }}>
              🎯 {summary.totalSignals} real people found complaining about this exact problem — right now
            </h1>
          </div>

          {/* Subline */}
          <p style={{ fontSize: 13, color: "#64748B", marginBottom: 10 }}>
            Scanned Reddit, IndieHackers, Quora and ProductHunt in real-time
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#64748B" }}>{idea}</span>
            <span style={{ color: "#CBD5E1" }}>·</span>
            <span style={{ fontSize: 13, color: "#64748B" }}>{targetCustomer}</span>
            <span style={{ color: "#CBD5E1" }}>·</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981", background: "#D1FAE5", borderRadius: 100, padding: "2px 10px" }}>{geography}</span>
            {summary.urgencyScore >= 70 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", background: "#FEE2E2", borderRadius: 100, padding: "2px 10px" }}>
                🔥 High Urgency
              </span>
            )}
          </div>
        </motion.div>

        {/* Bright Data badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#FF6B3510", border: "1px solid #FF6B3540",
            borderRadius: 100, padding: "5px 14px",
          }}>
            <span style={{ fontSize: 13 }}>⚡</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#FF6B35" }}>
              Live data via Bright Data SERP API — {scanMeta?.brightDataSearches ?? 4} searches run
            </span>
          </div>
          {scanMeta && (
            <span style={{ fontSize: 11, color: "#94A3B8" }}>
              Completed in {scanMeta.scanDuration}s
            </span>
          )}
        </motion.div>

        {/* Stats bar */}
        {scanMeta && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16,
            }}
          >
            {[
              { icon: "⚡", label: `${scanMeta.apiCallCount} Bright Data API calls` },
              { icon: "📊", label: `${filteredSignals.length} signals analyzed` },
              { icon: "⏱", label: `Completed in ${scanMeta.scanDuration}s` },
            ].map((stat) => (
              <div key={stat.label} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8,
                padding: "6px 14px", fontSize: 12, color: "#475569", fontWeight: 600,
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}>
                <span>{stat.icon}</span>
                <span>{stat.label}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Scan summary — platform breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          style={{
            background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10,
            padding: "12px 18px", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", marginRight: 4 }}>SCAN SUMMARY</span>
          {[
            { name: "Reddit", emoji: "🔴", color: "#FF4500" },
            { name: "IndieHackers", emoji: "🟣", color: "#6366F1" },
            { name: "Quora", emoji: "🔵", color: "#B92B27" },
            { name: "ProductHunt", emoji: "🟠", color: "#DA552F" },
          ].map((p, i) => (
            <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {i > 0 && <span style={{ color: "#CBD5E1", fontSize: 10 }}>|</span>}
              <span style={{ fontSize: 12, color: p.color, fontWeight: 700 }}>{p.emoji} {p.name}</span>
              <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>: {platformCounts[p.name] ?? 0}</span>
            </div>
          ))}
        </motion.div>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>

          {/* Signals feed */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filteredSignals.map((signal, i) => {
              const reachStyle = REACH_STYLES[signal.reachability] ?? REACH_STYLES.medium;
              const resolvedPlatform = platformFromUrl(signal.url ?? "", signal.platform);
              const platformStyle = PLATFORM_STYLES[resolvedPlatform] ?? PLATFORM_STYLES.Web;

              return (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderLeft: `4px solid ${platformBorderColor(signal.platform, signal.url)}`,
                    borderRadius: 12,
                    padding: "18px 20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <PlatformBadge platform={signal.platform} url={signal.url} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#10B981" }}>
                        {formatUsername(signal.username, signal.platform, signal.url)}
                      </span>
                      {signal.subreddit && (
                        signal.url ? (
                          <a
                            href={`https://www.reddit.com/${signal.subreddit}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 11, color: "#FF4500", background: "#FFF4F0", border: "1px solid #FF450030", borderRadius: 100, padding: "2px 8px", textDecoration: "none", fontWeight: 600 }}
                          >
                            {signal.subreddit}
                          </a>
                        ) : (
                          <span style={{ fontSize: 11, color: "#64748B", background: "#F1F5F9", borderRadius: 100, padding: "2px 8px" }}>
                            {signal.subreddit}
                          </span>
                        )
                      )}
                      {typeof signal.score === "number" && signal.score > 0 && (
                        <span style={{ fontSize: 11, color: "#F59E0B", fontWeight: 600 }}>▲ {signal.score}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>
                      {signal.timeAgo && signal.timeAgo !== "recently" ? signal.timeAgo : "just now"}
                    </span>
                  </div>

                  {/* Quote */}
                  <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.65, marginBottom: 10 }}>
                    &ldquo;{highlightKeywords(signal.quote, signal.painKeywords)}&rdquo;
                  </p>

                  {/* Context */}
                  <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5, marginBottom: 12 }}>
                    {signal.context}
                  </p>

                  {/* Bottom row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {signal.painKeywords.slice(0, 3).map((kw) => (
                        <span key={kw} style={{ fontSize: 10, fontWeight: 700, color: "#10B981", background: "#D1FAE5", borderRadius: 4, padding: "2px 7px" }}>
                          {kw}
                        </span>
                      ))}
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        color: reachStyle.color, background: reachStyle.bg,
                        borderRadius: 4, padding: "2px 7px",
                      }}>
                        {reachStyle.emoji} {signal.reachability} reach
                      </span>
                      <GeoTag geography={geography} />
                    </div>
                    {signal.url ? (
                      <a
                        href={signal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 12, fontWeight: 600, color: "#10B981",
                          background: "#F0FDF4", border: "1px solid #A7F3D0",
                          borderRadius: 6, padding: "5px 12px", textDecoration: "none",
                          display: "flex", alignItems: "center", gap: 5,
                        }}
                      >
                        <span style={{ fontSize: 10 }}>{platformStyle.emoji}</span>
                        Reach them →
                      </a>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 76 }}>

            {/* Urgency score */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", marginBottom: 10 }}>URGENCY SCORE</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 10 }}>
                <span style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 800, color: summary.urgencyScore >= 70 ? "#DC2626" : summary.urgencyScore >= 40 ? "#F59E0B" : "#10B981", letterSpacing: "-0.04em" }}>
                  {summary.urgencyScore}
                </span>
                <span style={{ fontSize: 14, color: "#94A3B8" }}>/100</span>
              </div>
              <div style={{ height: 6, borderRadius: 100, background: "#F1F5F9", overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${summary.urgencyScore}%`, borderRadius: 100,
                  background: summary.urgencyScore >= 70 ? "#DC2626" : summary.urgencyScore >= 40 ? "#F59E0B" : "#10B981",
                  transition: "width 1s ease",
                }} />
              </div>
            </motion.div>

            {/* Top communities */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", marginBottom: 14 }}>TOP COMMUNITIES</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {summary.topCommunities
                  .filter((c) => ["Reddit", "IndieHackers", "ProductHunt", "Quora"].includes(c.platform))
                  .slice(0, 3)
                  .map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: "#F0FDF4", border: "1px solid #A7F3D0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#10B981", flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 2 }}>{c.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 10, color: "#64748B" }}>{c.platform}</span>
                          <span style={{
                            fontSize: 9, fontWeight: 700,
                            color: ACTIVITY_COLORS[c.activity] ?? "#94A3B8",
                            background: `${ACTIVITY_COLORS[c.activity] ?? "#94A3B8"}15`,
                            borderRadius: 100, padding: "1px 6px", letterSpacing: "0.04em",
                          }}>
                            {c.activity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>

            {/* Top pain points */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", marginBottom: 14 }}>TOP PAIN POINTS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {summary.topPainPoints.slice(0, 3).map((pain, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: "#EF4444", fontSize: 12, flexShrink: 0, marginTop: 1 }}>▸</span>
                    <span style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>{pain}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Best time to post */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              style={{ background: "#F0FDF4", border: "1px solid #A7F3D0", borderRadius: 12, padding: "16px" }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#10B981", letterSpacing: "0.06em", marginBottom: 6 }}>BEST TIME TO POST</div>
              <p style={{ fontSize: 12, color: "#065F46", lineHeight: 1.55 }}>{summary.bestTimeToPost}</p>
            </motion.div>

          </div>
        </div>

        {/* Insight + Playbook CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ marginTop: 32 }}
        >
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "20px 24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#10B981", letterSpacing: "0.06em", marginBottom: 8 }}>💡 KEY INSIGHT</div>
            <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.7 }}>{insight}</p>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "28px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <h3 style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em", marginBottom: 8 }}>
              Ready to reach these people?
            </h3>
            <p style={{ color: "#64748B", fontSize: 13, marginBottom: 24, maxWidth: 440, margin: "0 auto 24px" }}>
              Generate your customer playbook — outreach templates, week 1 action plan, and exactly how to land your first 100 customers.
            </p>

            <AnimatePresence>
              {playbookError && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ color: "#EF4444", fontSize: 13, marginBottom: 14 }}>
                  {playbookError}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={generatingPlaybook ? {} : { opacity: 0.88, y: -2 }}
              whileTap={generatingPlaybook ? {} : { scale: 0.97 }}
              onClick={() => !generatingPlaybook && void handleGeneratePlaybook()}
              style={{
                background: "#10B981", color: "#FFFFFF", border: "none", borderRadius: 9,
                padding: "14px 40px", fontSize: 15, fontWeight: 700,
                fontFamily: "var(--font-body), Inter, sans-serif",
                cursor: generatingPlaybook ? "not-allowed" : "pointer",
                boxShadow: generatingPlaybook ? "none" : "0 4px 20px rgba(16,185,129,0.30)",
                opacity: generatingPlaybook ? 0.7 : 1,
                display: "inline-flex", alignItems: "center", gap: 10,
              }}
            >
              {generatingPlaybook ? <><LoadingDots color="#FFFFFF" /> Building playbook...</> : "Generate Outreach Playbook →"}
            </motion.button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
