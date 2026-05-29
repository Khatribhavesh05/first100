"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { ResearchReport } from "@/app/api/research/route";
import type { StrategyReport } from "@/app/api/strategy/route";

const THREAT_COLORS: Record<string, string> = {
  high: "#EF4444",
  medium: "#F59E0B",
  low: "#10B981",
};

const GAP_SIZE_COLORS: Record<string, string> = {
  large: "#6366F1",
  medium: "#F59E0B",
  small: "#10B981",
};

const MATURITY_COLORS: Record<string, string> = {
  emerging: "#10B981",
  growing: "#6366F1",
  mature: "#F59E0B",
  declining: "#EF4444",
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

export default function ResearchPage() {
  const router = useRouter();
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [idea, setIdea] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);
  const [expandedCompetitor, setExpandedCompetitor] = useState<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("fs_research");
    setIdea(localStorage.getItem("fs_idea") ?? "");
    setTargetMarket(localStorage.getItem("fs_targetMarket") ?? "");
    if (raw) {
      try { setReport(JSON.parse(raw) as ResearchReport); } catch { /* ignore */ }
    }
  }, []);

  const handleGenerateStrategy = async () => {
    setGeneratingStrategy(true);
    setStrategyError(null);
    try {
      const res = await fetch("/api/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, targetMarket, researchData: report }),
      });
      const data = await res.json() as { success?: boolean; data?: StrategyReport; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error ?? "Strategy generation failed.");
      localStorage.setItem("fs_strategy", JSON.stringify(data.data));
      router.push("/strategy");
    } catch (err) {
      setStrategyError(err instanceof Error ? err.message : "Something went wrong.");
      setGeneratingStrategy(false);
    }
  };

  if (!report) {
    return (
      <div style={{ background: "#0A0A0A", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-body), Inter, sans-serif", gap: 16 }}>
        <div style={{ fontSize: 32 }}>◎</div>
        <p style={{ color: "#888888", fontSize: 14 }}>No report found.</p>
        <button onClick={() => router.push("/analyze")} style={{ background: "#6366F1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Run Analysis →
        </button>
      </div>
    );
  }

  const maturity = report.summary?.marketMaturity ?? "growing";

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "#FFFFFF", fontFamily: "var(--font-body), Inter, sans-serif", position: "relative" }}>
      {/* Glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse 60% 30% at 50% 0%, rgba(99,102,241,0.07), transparent 60%)" }} />

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(10,10,10,0.88)", backdropFilter: "blur(12px)" }}>
        <button onClick={() => router.push("/")} style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, color: "#6366F1", letterSpacing: "-0.04em", background: "transparent", border: "none", cursor: "pointer" }}>
          FounderScope
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {[{ label: "Research", done: true }, { label: "Strategy", done: false }].map((s, i) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: s.done ? "#10B981" : "#555555" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: s.done ? "#10B98120" : "#1A1A1A", border: `2px solid ${s.done ? "#10B98150" : "#2A2A2A"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: s.done ? "#10B981" : "#555555", fontWeight: 700 }}>
                  {s.done ? "✓" : i + 1}
                </div>
                <span>{s.label}</span>
              </div>
              {i < 1 && <div style={{ width: 24, height: 1, background: "#2A2A2A" }} />}
            </div>
          ))}
        </div>
      </nav>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "48px 24px 96px" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#6366F115", border: "1px solid #6366F130", borderRadius: 100, padding: "4px 12px" }}>
              <span style={{ color: "#6366F1", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}>MARKET RESEARCH</span>
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: `${MATURITY_COLORS[maturity]}15`,
              border: `1px solid ${MATURITY_COLORS[maturity]}30`,
              borderRadius: 100, padding: "4px 12px",
            }}>
              <span style={{ color: MATURITY_COLORS[maturity], fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {maturity} market
              </span>
            </div>
          </div>
          <h1 style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.04em", marginBottom: 6 }}>
            {idea || "Your Market"}
          </h1>
          <p style={{ color: "#666666", fontSize: 13 }}>Target: {targetMarket}</p>
        </motion.div>

        {/* Warning banner */}
        {report.warning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: "#F59E0B08", border: "1px solid #F59E0B25", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: "#FDE68A", lineHeight: 1.6 }}>
            {report.warning}
          </motion.div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Quick verdict */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
            style={{ background: "linear-gradient(135deg, #6366F112, #8B5CF608)", border: "1px solid #6366F130", borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: 14 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>🔍</span>
            <div>
              <div style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#F5F5F5", marginBottom: 6, letterSpacing: "-0.01em" }}>
                Analyst Verdict
              </div>
              <p style={{ fontSize: 13, color: "#C4B5FD", lineHeight: 1.7 }}>{report.summary?.quickVerdict}</p>
            </div>
          </motion.div>

          {/* Market Overview */}
          <Section title="Market Overview" icon="🌐" color="#6366F1" delay={0.08}>
            <p style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.85, whiteSpace: "pre-line" }}>
              {report.summary?.marketOverview}
            </p>
          </Section>

          {/* Competitors */}
          <Section title={`${report.competitors?.length ?? 0} Competitors Mapped`} icon="🎯" color="#EF4444" delay={0.14}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(report.competitors ?? []).map((comp, i) => {
                const tColor = THREAT_COLORS[comp.threatLevel] ?? "#F59E0B";
                const isExpanded = expandedCompetitor === i;
                return (
                  <motion.div
                    key={i}
                    layout
                    onClick={() => setExpandedCompetitor(isExpanded ? null : i)}
                    style={{ background: "#111111", border: `1px solid ${isExpanded ? `${tColor}30` : "#1A1A1A"}`, borderRadius: 10, padding: "15px 18px", cursor: "pointer", transition: "border-color 0.2s" }}
                    onMouseEnter={(e) => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.borderColor = "#2A2A2A"; }}
                    onMouseLeave={(e) => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.borderColor = "#1A1A1A"; }}
                  >
                    {/* Header row */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#F5F5F5" }}>
                            {comp.name}
                          </span>
                          {comp.fundingStatus && comp.fundingStatus !== "Unknown" && (
                            <span style={{ fontSize: 10, color: "#888888", background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 4, padding: "2px 8px", fontWeight: 600 }}>
                              {comp.fundingStatus}
                            </span>
                          )}
                        </div>
                        {comp.tagline && (
                          <p style={{ fontSize: 11, color: "#555555", marginTop: 2, fontStyle: "italic" }}>"{comp.tagline}"</p>
                        )}
                        <p style={{ fontSize: 12, color: "#888888", marginTop: 4, lineHeight: 1.5 }}>{comp.description}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: tColor, background: `${tColor}15`, border: `1px solid ${tColor}30`, borderRadius: 100, padding: "3px 10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          {comp.threatLevel}
                        </span>
                        <span style={{ color: "#555555", fontSize: 12, transition: "transform 0.2s", display: "inline-block", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
                      </div>
                    </div>

                    {/* Expanded */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22 }}
                          style={{ overflow: "hidden" }}
                        >
                          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #1A1A1A", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
                            <InfoBlock label="PRICING" value={comp.pricing} />
                            <InfoBlock label="TARGET CUSTOMER" value={comp.targetCustomer} />
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#10B98170", letterSpacing: "0.06em", marginBottom: 7 }}>STRENGTHS</div>
                              {comp.strengths.map((s, j) => (
                                <div key={j} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                                  <span style={{ color: "#10B981", fontSize: 11, flexShrink: 0 }}>+</span>
                                  <span style={{ fontSize: 12, color: "#9CA3AF" }}>{s}</span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#EF444470", letterSpacing: "0.06em", marginBottom: 7 }}>WEAKNESSES</div>
                              {comp.weaknesses.map((w, j) => (
                                <div key={j} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                                  <span style={{ color: "#EF4444", fontSize: 11, flexShrink: 0 }}>−</span>
                                  <span style={{ fontSize: 12, color: "#9CA3AF" }}>{w}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Stealable users — full width callout */}
                          {comp.stealableUsers && (
                            <div style={{ marginTop: 12, background: "#6366F108", border: "1px solid #6366F120", borderRadius: 7, padding: "10px 14px" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#6366F1", letterSpacing: "0.06em", marginBottom: 4 }}>🎯 STEAL THEIR USERS</div>
                              <p style={{ fontSize: 12, color: "#C4B5FD", lineHeight: 1.6 }}>{comp.stealableUsers}</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </Section>

          {/* Market Gaps */}
          <Section title="Market Gaps" icon="🔓" color="#10B981" delay={0.22}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(report.marketGaps ?? []).map((gap, i) => {
                const sColor = GAP_SIZE_COLORS[gap.size] ?? "#6366F1";
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.05 }}
                    style={{ background: "#0E0E0E", border: "1px solid #1A1A1A", borderRadius: 9, padding: "16px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, background: sColor, borderRadius: "9px 0 0 9px" }} />
                    <div style={{ paddingLeft: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                        <span style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "#F5F5F5" }}>
                          {gap.gap}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: sColor, background: `${sColor}15`, border: `1px solid ${sColor}30`, borderRadius: 100, padding: "2px 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          {gap.size}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "#888888", lineHeight: 1.6, marginBottom: 6 }}>
                        <span style={{ color: "#555555", fontWeight: 600 }}>Evidence: </span>{gap.evidence}
                      </p>
                      <p style={{ fontSize: 12, color: "#10B981", lineHeight: 1.6 }}>
                        <span style={{ fontWeight: 600 }}>Opportunity: </span>{gap.opportunity}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Section>

          {/* Opportunities */}
          <Section title="Strategic Opportunities" icon="💡" color="#8B5CF6" delay={0.30}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(report.opportunities ?? []).map((opp, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.05 }}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, background: "#8B5CF615", border: "1px solid #8B5CF630", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#8B5CF6", flexShrink: 0, marginTop: 1 }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 13, color: "#D1D5DB", lineHeight: 1.7 }}>{opp}</span>
                </motion.div>
              ))}
            </div>
          </Section>

          {/* Strategy CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
            style={{ background: "#0E0E0E", border: "1px solid #1A1A1A", borderRadius: 12, padding: "28px", textAlign: "center" }}>
            <h3 style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.03em", marginBottom: 8 }}>
              Ready for your GTM strategy?
            </h3>
            <p style={{ color: "#888888", fontSize: 13, marginBottom: 22 }}>
              We'll use this live research to build your full go-to-market playbook — positioning, ICP, channels, pricing, and a 3-phase roadmap.
            </p>

            <AnimatePresence>
              {strategyError && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ color: "#EF4444", fontSize: 13, marginBottom: 14 }}>
                  {strategyError}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={generatingStrategy ? {} : { opacity: 0.88, y: -2 }}
              whileTap={generatingStrategy ? {} : { scale: 0.97 }}
              onClick={() => !generatingStrategy && void handleGenerateStrategy()}
              style={{ background: "#10B981", color: "#FFFFFF", border: "none", borderRadius: 8, padding: "13px 36px", fontSize: 15, fontWeight: 700, fontFamily: "var(--font-body), Inter, sans-serif", cursor: generatingStrategy ? "not-allowed" : "pointer", boxShadow: generatingStrategy ? "none" : "0 0 32px rgba(16,185,129,0.3)", opacity: generatingStrategy ? 0.7 : 1, display: "inline-flex", alignItems: "center", gap: 10 }}>
              {generatingStrategy ? <><LoadingDots color="#FFFFFF" /> Building strategy...</> : "Generate GTM Strategy →"}
            </motion.button>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({ title, icon, color, delay, children }: { title: string; icon: string; color: string; delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      style={{ background: "#0D0D0D", border: "1px solid #1A1A1A", borderRadius: 12, padding: "24px", position: "relative", overflow: "hidden" }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}60, transparent)` }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: `${color}14`, border: `1px solid ${color}30` }}>
          {icon}
        </div>
        <h2 style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#F5F5F5", letterSpacing: "-0.02em" }}>
          {title}
        </h2>
      </div>
      {children}
    </motion.div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#555555", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
      <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6 }}>{value}</p>
    </div>
  );
}
