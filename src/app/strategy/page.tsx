"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { StrategyReport } from "@/app/api/strategy/route";

// ── Helpers ───────────────────────────────────────────────────────────────────

const PHASE_COLORS = ["#6366F1", "#F59E0B", "#10B981"];

const CONVERSION_ROLE_COLORS: Record<string, string> = {
  acquisition: "#6366F1",
  monetization: "#10B981",
  expansion: "#F59E0B",
};

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.95 }}
      style={{
        position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
        background: "#111111", border: "1px solid #2A2A2A", borderRadius: 10,
        padding: "12px 20px", fontSize: 14, color: "#F5F5F5", fontWeight: 500,
        zIndex: 100, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", whiteSpace: "nowrap",
        display: "flex", alignItems: "center", gap: 8,
        fontFamily: "var(--font-body), Inter, sans-serif",
      }}
    >
      <span style={{ color: "#10B981" }}>✓</span>
      {message}
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StrategyPage() {
  const router = useRouter();
  const [strategy, setStrategy] = useState<StrategyReport | null>(null);
  const [idea, setIdea] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("fs_strategy");
    setIdea(localStorage.getItem("fs_idea") ?? "");
    if (raw) {
      try { setStrategy(JSON.parse(raw) as StrategyReport); } catch { /* ignore */ }
    }
  }, []);

  if (!strategy) {
    return (
      <div style={{ background: "#0A0A0A", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-body), Inter, sans-serif", gap: 16 }}>
        <div style={{ fontSize: 32 }}>◎</div>
        <p style={{ color: "#888888", fontSize: 14 }}>No strategy found.</p>
        <button onClick={() => router.push("/analyze")} style={{ background: "#6366F1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Start Over →
        </button>
      </div>
    );
  }

  const proj = strategy.revenueProjections;

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "#FFFFFF", fontFamily: "var(--font-body), Inter, sans-serif", position: "relative" }}>
      {/* Glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse 60% 30% at 50% 0%, rgba(16,185,129,0.07), transparent 60%)" }} />

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(10,10,10,0.88)", backdropFilter: "blur(12px)" }}>
        <button onClick={() => router.push("/")} style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, color: "#6366F1", letterSpacing: "-0.04em", background: "transparent", border: "none", cursor: "pointer" }}>
          FounderScope
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => router.push("/research")} style={{ background: "transparent", border: "1px solid #2A2A2A", color: "#888888", padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body), Inter, sans-serif" }}>
            ← Research
          </button>
          <motion.button whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.97 }} onClick={() => setToast("PDF export coming soon!")}
            style={{ background: "#10B981", color: "#FFFFFF", border: "none", borderRadius: 6, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body), Inter, sans-serif", boxShadow: "0 0 16px rgba(16,185,129,0.2)" }}>
            Export Report ↗
          </motion.button>
        </div>
      </nav>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "48px 24px 96px" }}>

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#10B98115", border: "1px solid #10B98130", borderRadius: 100, padding: "4px 12px", marginBottom: 14 }}>
            <span style={{ color: "#10B981", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}>GTM STRATEGY</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.04em", marginBottom: 6 }}>
            {idea || "Your Strategy"}
          </h1>
          {strategy.positioning?.category && (
            <p style={{ color: "#555555", fontSize: 13 }}>Category: <span style={{ color: "#888888" }}>{strategy.positioning.category}</span></p>
          )}
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Positioning Hero ────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
            style={{ background: "linear-gradient(135deg, #6366F115, #8B5CF608)", border: "1px solid #6366F135", borderRadius: 14, padding: "28px 28px 24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #6366F1, #8B5CF6, transparent)" }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6366F1", letterSpacing: "0.1em", marginBottom: 14 }}>POSITIONING</div>
            <h2 style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.04em", marginBottom: 12, lineHeight: 1.15 }}>
              "{strategy.positioning?.tagline}"
            </h2>
            <p style={{ fontSize: 14, color: "#9CA3AF", lineHeight: 1.75, marginBottom: 16 }}>
              {strategy.positioning?.valueProposition}
            </p>
            <div style={{ background: "#6366F110", border: "1px solid #6366F125", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6366F1", letterSpacing: "0.08em", marginBottom: 4 }}>UNIQUE ANGLE</div>
              <p style={{ fontSize: 13, color: "#C4B5FD", lineHeight: 1.65 }}>{strategy.positioning?.uniqueAngle}</p>
            </div>
          </motion.div>

          {/* ── ICP ─────────────────────────────────────────────────────────── */}
          <Section title="Ideal Customer Profile" icon="👤" color="#F59E0B" delay={0.06}>
            <p style={{ fontSize: 14, color: "#D1D5DB", lineHeight: 1.7, marginBottom: 20 }}>
              {strategy.idealCustomerProfile?.description}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
              {/* Pain points */}
              <div>
                <Label color="#F59E0B">PAIN POINTS</Label>
                {(strategy.idealCustomerProfile?.painPoints ?? []).map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                    <span style={{ color: "#F59E0B", fontSize: 12, flexShrink: 0, marginTop: 2 }}>▸</span>
                    <span style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.55 }}>{p}</span>
                  </div>
                ))}
              </div>
              {/* Where to find */}
              <div>
                <Label color="#6366F1">WHERE TO FIND THEM</Label>
                {(strategy.idealCustomerProfile?.whereToFind ?? []).map((place, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                    <span style={{ color: "#6366F1", fontSize: 12, flexShrink: 0, marginTop: 2 }}>◉</span>
                    <span style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.55 }}>{place}</span>
                  </div>
                ))}
              </div>
              {/* Current solution + WTP */}
              <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <Chip label="WILLINGNESS TO PAY" value={strategy.idealCustomerProfile?.willingnessToPay} color="#10B981" />
                <div style={{ background: "#F59E0B08", border: "1px solid #F59E0B20", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B80", letterSpacing: "0.06em", marginBottom: 6 }}>CURRENT SOLUTION</div>
                  <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6 }}>{strategy.idealCustomerProfile?.currentSolution}</p>
                </div>
              </div>
            </div>
          </Section>

          {/* ── GTM Phases (vertical timeline) ──────────────────────────────── */}
          <Section title="90-Day GTM Roadmap" icon="🗺️" color="#6366F1" delay={0.12}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 19, top: 0, bottom: 0, width: 1, background: "linear-gradient(to bottom, #6366F150, transparent)" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {(strategy.gtmPhases ?? []).map((phase, i) => {
                  const pc = PHASE_COLORS[i] ?? "#6366F1";
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.08 }}
                      style={{ paddingLeft: 48, paddingBottom: i < (strategy.gtmPhases?.length ?? 0) - 1 ? 28 : 0, position: "relative" }}>
                      {/* Phase dot */}
                      <div style={{ position: "absolute", left: 10, top: 3, width: 20, height: 20, borderRadius: "50%", background: `${pc}20`, border: `2px solid ${pc}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: pc }}>
                        {phase.phase}
                      </div>
                      {/* Phase header */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                        <span style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#F5F5F5", letterSpacing: "-0.02em" }}>
                          {phase.goal}
                        </span>
                        <span style={{ fontSize: 11, color: pc, background: `${pc}15`, border: `1px solid ${pc}30`, borderRadius: 100, padding: "2px 9px", fontWeight: 600 }}>
                          {phase.timeline}
                        </span>
                        <span style={{ fontSize: 11, color: "#888888", background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 100, padding: "2px 9px", fontWeight: 600 }}>
                          Budget: {phase.budget}
                        </span>
                      </div>
                      {/* Actions */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                        {(phase.actions ?? []).map((action, j) => (
                          <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#111111", border: "1px solid #1A1A1A", borderRadius: 7, padding: "10px 12px" }}>
                            <div style={{ width: 18, height: 18, borderRadius: 4, background: `${pc}15`, border: `1px solid ${pc}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: pc, flexShrink: 0, marginTop: 1 }}>
                              {j + 1}
                            </div>
                            <span style={{ fontSize: 12, color: "#D1D5DB", lineHeight: 1.6 }}>{action}</span>
                          </div>
                        ))}
                      </div>
                      {/* Success metric */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#555555", letterSpacing: "0.06em" }}>WIN CONDITION:</span>
                        <span style={{ fontSize: 12, color: pc, fontWeight: 600 }}>{phase.successMetric}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* ── Pricing Tiers ───────────────────────────────────────────────── */}
          <Section title="Pricing Strategy" icon="💰" color="#10B981" delay={0.18}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#10B98108", border: "1px solid #10B98120", borderRadius: 8, padding: "11px 14px", marginBottom: 18 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#10B981", flexShrink: 0, marginTop: 2, letterSpacing: "0.06em" }}>MODEL</span>
              <span style={{ fontSize: 13, color: "#6EE7B7", marginLeft: 12, lineHeight: 1.5 }}>{strategy.pricing?.model}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 14 }}>
              {(strategy.pricing?.tiers ?? []).map((tier, i) => {
                const roleColor = CONVERSION_ROLE_COLORS[tier.conversionRole?.toLowerCase().split(" ")[0] ?? ""] ?? "#6366F1";
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 + i * 0.06 }}
                    style={{ background: "#111111", border: `1px solid ${i === 0 ? "#10B98130" : "#1A1A1A"}`, borderRadius: 10, padding: "18px", position: "relative", overflow: "hidden" }}>
                    {i === 0 && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #10B981, transparent)" }} />}
                    <div style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#F5F5F5", marginBottom: 4 }}>{tier.name}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#10B981", marginBottom: 4, fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>{tier.price}</div>
                    <p style={{ fontSize: 11, color: "#555555", marginBottom: 12, lineHeight: 1.5 }}>{tier.targetUser}</p>
                    <div style={{ marginBottom: 12 }}>
                      {(tier.features ?? []).map((feat, j) => (
                        <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 5 }}>
                          <span style={{ color: "#10B981", fontSize: 11, flexShrink: 0 }}>✓</span>
                          <span style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.5 }}>{feat}</span>
                        </div>
                      ))}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: roleColor, background: `${roleColor}15`, border: `1px solid ${roleColor}30`, borderRadius: 100, padding: "3px 9px", letterSpacing: "0.04em" }}>
                      {tier.conversionRole}
                    </span>
                  </motion.div>
                );
              })}
            </div>
            <p style={{ fontSize: 12, color: "#555555", lineHeight: 1.65, fontStyle: "italic" }}>{strategy.pricing?.rationale}</p>
          </Section>

          {/* ── Competitive Advantage ───────────────────────────────────────── */}
          <Section title="Competitive Advantage" icon="🛡️" color="#8B5CF6" delay={0.24}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              {[
                { label: "MOAT", value: strategy.competitiveAdvantage?.moat, color: "#8B5CF6" },
                { label: "UNFAIR EDGE", value: strategy.competitiveAdvantage?.unfairEdge, color: "#6366F1" },
                { label: "BECOMES DEFENSIBLE", value: strategy.competitiveAdvantage?.timeline, color: "#10B981" },
              ].map((item) => (
                <div key={item.label} style={{ background: `${item.color}08`, border: `1px solid ${item.color}20`, borderRadius: 8, padding: "14px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: item.color, letterSpacing: "0.06em", marginBottom: 8 }}>{item.label}</div>
                  <p style={{ fontSize: 13, color: "#D1D5DB", lineHeight: 1.65 }}>{item.value}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Revenue Projections ─────────────────────────────────────────── */}
          <Section title="Revenue Projections" icon="📈" color="#F59E0B" delay={0.30}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["Milestone", "Users", "Revenue", "Assumption"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 10, fontWeight: 700, color: "#555555", letterSpacing: "0.06em", borderBottom: "1px solid #1A1A1A" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {proj && [
                    { label: "Month 1", data: proj.month1 },
                    { label: "Month 3", data: proj.month3 },
                    { label: "Month 6", data: proj.month6 },
                    { label: "Month 12", data: proj.month12 },
                  ].map((row, i) => (
                    <motion.tr key={row.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.05 }}
                      style={{ borderBottom: "1px solid #111111" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 600, color: "#F5F5F5", fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: 13 }}>{row.label}</td>
                      <td style={{ padding: "12px 14px", color: "#9CA3AF" }}>{row.data?.users}</td>
                      <td style={{ padding: "12px 14px", color: "#10B981", fontWeight: 700, fontFamily: "var(--font-display), 'Space Grotesk', sans-serif" }}>{row.data?.revenue}</td>
                      <td style={{ padding: "12px 14px", color: "#6B7280", fontSize: 12, lineHeight: 1.5 }}>{row.data?.assumption}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── Top 5 Actions ───────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
            style={{ background: "#0D0D0D", border: "1px solid #1A1A1A", borderRadius: 12, padding: "24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #F59E0B60, transparent)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: "#F59E0B14", border: "1px solid #F59E0B30" }}>⚡</div>
              <h2 style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#F5F5F5", letterSpacing: "-0.02em" }}>
                Top 5 Actions — Start Monday
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {(strategy.topActions ?? []).map((action, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.42 + i * 0.06 }}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#111111", border: "1px solid #1A1A1A", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: "#F59E0B15", border: "1px solid #F59E0B30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#F59E0B", flexShrink: 0, fontFamily: "var(--font-display), 'Space Grotesk', sans-serif" }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 13, color: "#D1D5DB", lineHeight: 1.65 }}>{action}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Mandate (verdict card) ───────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}
            style={{ background: "linear-gradient(135deg, #10B98112, #05966908)", border: "1px solid #10B98135", borderRadius: 14, padding: "28px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #10B981, #6366F1, transparent)" }} />
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <span style={{ fontSize: 26, flexShrink: 0 }}>🚀</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, color: "#10B981", letterSpacing: "0.04em", marginBottom: 10 }}>
                  FOUNDER MANDATE
                </div>
                <p style={{ fontSize: 14, color: "#D1D5DB", lineHeight: 1.85, marginBottom: 20 }}>
                  {strategy.mandate}
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <motion.button whileHover={{ opacity: 0.88, y: -1 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setToast("PDF export coming soon!")}
                    style={{ background: "#10B981", color: "#FFFFFF", border: "none", borderRadius: 7, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body), Inter, sans-serif", boxShadow: "0 0 20px rgba(16,185,129,0.25)" }}>
                    Export Report ↗
                  </motion.button>
                  <button onClick={() => router.push("/analyze")}
                    style={{ background: "transparent", border: "1px solid #2A2A2A", color: "#888888", borderRadius: 7, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body), Inter, sans-serif" }}>
                    Analyze Another Idea
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({ title, icon, color, delay, children }: { title: string; icon: string; color: string; delay: number; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.45 }}
      style={{ background: "#0D0D0D", border: "1px solid #1A1A1A", borderRadius: 12, padding: "24px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}60, transparent)` }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: `${color}14`, border: `1px solid ${color}30` }}>{icon}</div>
        <h2 style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#F5F5F5", letterSpacing: "-0.02em" }}>{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

function Label({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: `${color}80`, letterSpacing: "0.06em", marginBottom: 10 }}>{children}</div>
  );
}

function Chip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
      <p style={{ fontSize: 13, color: "#D1D5DB", lineHeight: 1.55, fontWeight: 600 }}>{value}</p>
    </div>
  );
}
