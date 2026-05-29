"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { PlaybookReport } from "@/app/api/playbook/route";

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
        background: "#0F172A", border: "1px solid #1E293B", borderRadius: 10,
        padding: "12px 20px", fontSize: 14, color: "#F8FAFC", fontWeight: 500,
        zIndex: 100, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", whiteSpace: "nowrap",
        display: "flex", alignItems: "center", gap: 8,
        fontFamily: "var(--font-body), Inter, sans-serif",
      }}
    >
      <span style={{ color: "#10B981" }}>✓</span>
      {message}
    </motion.div>
  );
}

function Section({ title, icon, color, delay, children }: {
  title: string; icon: string; color: string; delay: number; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "24px", position: "relative", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}70, transparent)` }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: `${color}14`, border: `1px solid ${color}30` }}>
          {icon}
        </div>
        <h2 style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>
          {title}
        </h2>
      </div>
      {children}
    </motion.div>
  );
}

const CHANNEL_COLORS: Record<string, string> = {
  "Reddit Post": "#FF4500",
  "Reddit DM": "#FF4500",
  "Cold Email": "#6366F1",
};

export default function PlaybookPage() {
  const router = useRouter();
  const [playbook, setPlaybook] = useState<PlaybookReport | null>(null);
  const [idea, setIdea] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("f1_playbook");
    setIdea(localStorage.getItem("f1_idea") ?? "");
    if (raw) {
      try { setPlaybook(JSON.parse(raw) as PlaybookReport); } catch { /* ignore */ }
    }
  }, []);

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      setToast("Could not copy to clipboard.");
    }
  };

  const handleExport = () => {
    if (!playbook) return;

    // Inject print styles
    const style = document.createElement("style");
    style.id = "__playbook_print__";
    style.innerHTML = `
      @media print {
        nav, .no-print { display: none !important; }
        body { background: white !important; font-family: Inter, sans-serif; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .print-break { page-break-before: always; }
      }
      @media screen {
        #__playbook_print__ { display: none; }
      }
    `;
    document.head.appendChild(style);

    // Give browser a moment to apply styles
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.getElementById("__playbook_print__")?.remove();
      }, 500);
    }, 100);
  };

  if (!playbook) {
    return (
      <div style={{ background: "#FAFAFA", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-body), Inter, sans-serif", gap: 16 }}>
        <div style={{ fontSize: 36, color: "#10B981" }}>◎</div>
        <p style={{ color: "#64748B", fontSize: 14 }}>No playbook found.</p>
        <button onClick={() => router.push("/results")} style={{ background: "#10B981", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          ← Back to Results
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "#FAFAFA", minHeight: "100vh", color: "#0F172A", fontFamily: "var(--font-body), Inter, sans-serif" }}>
      {/* Nav */}
      <nav
        className="no-print"
        style={{
          position: "sticky", top: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 32px", borderBottom: "1px solid #E2E8F0",
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
        }}
      >
        <button onClick={() => router.push("/")} style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 17, color: "#10B981", letterSpacing: "-0.04em", background: "transparent", border: "none", cursor: "pointer" }}>
          First100
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => router.push("/results")} style={{ background: "transparent", border: "1px solid #E2E8F0", color: "#64748B", padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body), Inter, sans-serif" }}>
            ← Signals
          </button>
          <motion.button
            whileHover={{ opacity: 0.88 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleExport}
            style={{ background: "#10B981", color: "#FFFFFF", border: "none", borderRadius: 6, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body), Inter, sans-serif", boxShadow: "0 2px 8px rgba(16,185,129,0.25)" }}
          >
            Export Playbook ↗
          </motion.button>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 96px" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#D1FAE5", border: "1px solid #A7F3D0", borderRadius: 100, padding: "4px 12px", marginBottom: 14 }}>
            <span style={{ color: "#10B981", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}>CUSTOMER PLAYBOOK</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.04em", marginBottom: 6 }}>
            {idea || "Your Playbook"}
          </h1>
          <p style={{ color: "#94A3B8", fontSize: 13 }}>Your complete roadmap to your first 100 customers</p>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Positioning */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: "linear-gradient(135deg, #F0FDF4, #ECFDF5)", border: "1px solid #A7F3D0", borderRadius: 14, padding: "28px", position: "relative", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #10B981, #34D399, transparent)" }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: "#10B981", letterSpacing: "0.1em", marginBottom: 14 }}>POSITIONING</div>
            <h2 style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.04em", marginBottom: 12, lineHeight: 1.2 }}>
              &ldquo;{playbook.positioning.oneLiner}&rdquo;
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 16 }}>
              <div style={{ background: "#FFFFFF", border: "1px solid #A7F3D0", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#10B981", letterSpacing: "0.06em", marginBottom: 6 }}>UNIQUE ANGLE</div>
                <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{playbook.positioning.uniqueAngle}</p>
              </div>
              <div style={{ background: "#FFFFFF", border: "1px solid #A7F3D0", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#10B981", letterSpacing: "0.06em", marginBottom: 6 }}>MESSAGING HOOK</div>
                <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{playbook.positioning.messagingHook}</p>
              </div>
            </div>
          </motion.div>

          {/* Ideal Customer */}
          <Section title="Ideal Customer Profile" icon="👤" color="#F59E0B" delay={0.06}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              {[
                { label: "WHO THEY ARE", value: playbook.idealCustomer.description, color: "#F59E0B" },
                { label: "WHERE THEY LIVE", value: playbook.idealCustomer.whereLive, color: "#6366F1" },
                { label: "THEIR EXACT PAIN", value: playbook.idealCustomer.currentPain, color: "#EF4444" },
                { label: "TRIGGER MOMENT", value: playbook.idealCustomer.triggerMoment, color: "#10B981" },
              ].map((item) => (
                <div key={item.label} style={{ background: "#FAFAFA", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: item.color, letterSpacing: "0.06em", marginBottom: 7 }}>{item.label}</div>
                  <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{item.value}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Outreach Templates */}
          <Section title="Outreach Templates" icon="✉️" color="#6366F1" delay={0.12}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {playbook.outreachTemplates.map((template, i) => {
                const channelColor = CHANNEL_COLORS[template.channel] ?? "#6366F1";
                const bodyText = template.body ?? template.message ?? "";
                return (
                  <div key={i} style={{ background: "#FAFAFA", border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #E2E8F0", background: "#FFFFFF" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: channelColor, background: `${channelColor}14`, border: `1px solid ${channelColor}30`, borderRadius: 100, padding: "3px 10px", letterSpacing: "0.04em" }}>
                          {template.channel}
                        </span>
                        {template.community && (
                          <span style={{ fontSize: 12, color: "#64748B" }}>in {template.community}</span>
                        )}
                        {template.bestTime && (
                          <span style={{ fontSize: 11, color: "#94A3B8" }}>· {template.bestTime}</span>
                        )}
                      </div>
                      <button
                        onClick={() => void handleCopy(bodyText, i)}
                        style={{ fontSize: 11, fontWeight: 600, color: copiedIndex === i ? "#10B981" : "#64748B", background: copiedIndex === i ? "#D1FAE5" : "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "var(--font-body), Inter, sans-serif", transition: "all 0.2s" }}
                      >
                        {copiedIndex === i ? "✓ Copied" : "Copy"}
                      </button>
                    </div>

                    <div style={{ padding: "16px" }}>
                      {(template.subject) && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", marginBottom: 4 }}>SUBJECT</div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{template.subject}</p>
                        </div>
                      )}
                      {template.triggerPost && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", marginBottom: 4 }}>RESPOND TO</div>
                          <p style={{ fontSize: 13, color: "#475569", fontStyle: "italic" }}>{template.triggerPost}</p>
                        </div>
                      )}
                      {bodyText && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", marginBottom: 6 }}>MESSAGE</div>
                          <pre style={{ fontSize: 13, color: "#334155", lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "var(--font-body), Inter, sans-serif", margin: 0 }}>
                            {bodyText}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Week 1 Plan */}
          <Section title="Week 1 Action Plan" icon="📅" color="#10B981" delay={0.18}>
            <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
              <div style={{ position: "absolute", left: 19, top: 0, bottom: 0, width: 1, background: "linear-gradient(to bottom, #A7F3D0, transparent)" }} />
              {playbook.weekOnePlan.map((day, i) => (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.22 + i * 0.07 }}
                  style={{ paddingLeft: 48, paddingBottom: i < playbook.weekOnePlan.length - 1 ? 24 : 0, position: "relative" }}
                >
                  <div style={{ position: "absolute", left: 10, top: 3, width: 20, height: 20, borderRadius: "50%", background: "#D1FAE5", border: "2px solid #10B981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#10B981" }}>
                    {i + 1}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                    <span style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                      {day.day}
                    </span>
                    <span style={{ fontSize: 11, color: "#10B981", background: "#D1FAE5", border: "1px solid #A7F3D0", borderRadius: 100, padding: "2px 9px", fontWeight: 600 }}>
                      {day.goal}
                    </span>
                    <span style={{ fontSize: 11, color: "#64748B", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 100, padding: "2px 9px", fontWeight: 600 }}>
                      {day.timeRequired}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {day.actions.map((action, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 7, padding: "10px 12px" }}>
                        <div style={{ width: 18, height: 18, borderRadius: 4, background: "#D1FAE5", border: "1px solid #A7F3D0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#10B981", flexShrink: 0, marginTop: 1 }}>
                          {j + 1}
                        </div>
                        <span style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>{action}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </Section>

          {/* Milestones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: "#F0FDF4", border: "1px solid #A7F3D0" }}>🏆</div>
              <h2 style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>
                Milestones
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
              {[
                { label: "WEEK 1", value: playbook.milestones.week1, color: "#10B981" },
                { label: "WEEK 2", value: playbook.milestones.week2, color: "#6366F1" },
                { label: "MONTH 1", value: playbook.milestones.month1, color: "#F59E0B" },
              ].map((m) => (
                <div key={m.label} style={{ background: `${m.color}08`, border: `1px solid ${m.color}25`, borderRadius: 8, padding: "14px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: m.color, letterSpacing: "0.08em", marginBottom: 7 }}>{m.label}</div>
                  <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.6, fontWeight: 600 }}>{m.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Export CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34 }}
            style={{ background: "linear-gradient(135deg, #F0FDF4, #ECFDF5)", border: "1px solid #A7F3D0", borderRadius: 14, padding: "28px", textAlign: "center", position: "relative", overflow: "hidden" }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #10B981, #34D399, transparent)" }} />
            <h3 style={{ fontFamily: "var(--font-display), 'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em", marginBottom: 8 }}>
              🚀 You&apos;re ready to find your first customer.
            </h3>
            <p style={{ color: "#64748B", fontSize: 13, marginBottom: 24 }}>
              Start with Day 1 of your action plan. Your first customer is one conversation away.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <motion.button
                whileHover={{ opacity: 0.88, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleExport}
                style={{ background: "#10B981", color: "#FFFFFF", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body), Inter, sans-serif", boxShadow: "0 4px 16px rgba(16,185,129,0.25)" }}
              >
                Export Playbook ↗
              </motion.button>
              <button
                onClick={() => router.push("/analyze")}
                style={{ background: "transparent", border: "1px solid #A7F3D0", color: "#10B981", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body), Inter, sans-serif" }}
              >
                Scan Another Idea
              </button>
            </div>
          </motion.div>

          {/* Bright Data footer badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}
          >
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#FF6B3510", border: "1px solid #FF6B3530",
              borderRadius: 100, padding: "6px 16px",
            }}>
              <span style={{ fontSize: 13 }}>⚡</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#FF6B35" }}>
                Powered by Bright Data SERP API
              </span>
              <span style={{ fontSize: 11, color: "#94A3B8" }}>· Signals found via live web scanning</span>
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
