"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const LOADING_MESSAGES = [
  "Scanning live web for competitors...",
  "Scraping competitor websites...",
  "Analyzing market gaps...",
  "Building your report...",
];

export default function AnalyzePage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const ideaRef = useRef<HTMLTextAreaElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loading) {
      setMsgIndex(0);
      intervalRef.current = setInterval(() => {
        setMsgIndex((i) => Math.min(i + 1, LOADING_MESSAGES.length - 1));
      }, 4500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [loading]);

  const handleSubmit = async () => {
    const trimmedIdea = idea.trim();
    const trimmedMarket = targetMarket.trim();

    if (!trimmedIdea) {
      setError("Please describe your startup idea.");
      ideaRef.current?.focus();
      return;
    }
    if (!trimmedMarket) {
      setError("Please specify your target market.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: trimmedIdea, targetMarket: trimmedMarket }),
      });

      const data = await res.json() as { success?: boolean; data?: unknown; error?: string };

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Research failed. Please try again.");
      }

      localStorage.setItem("fs_idea", trimmedIdea);
      localStorage.setItem("fs_targetMarket", trimmedMarket);
      localStorage.setItem("fs_research", JSON.stringify(data.data));

      router.push("/research");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey) void handleSubmit();
  };

  return (
    <div
      style={{
        background: "#0A0A0A",
        minHeight: "100vh",
        color: "#FFFFFF",
        fontFamily: "var(--font-body), Inter, sans-serif",
        position: "relative",
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: "radial-gradient(ellipse 60% 30% at 50% 0%, rgba(99,102,241,0.08), transparent 60%)",
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
        <button
          onClick={() => router.push("/")}
          style={{
            fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "#6366F1",
            letterSpacing: "-0.04em",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          FounderScope
        </button>
      </nav>

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 640,
          margin: "0 auto",
          padding: "60px 24px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            style={{
              fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
              fontSize: "clamp(28px, 5vw, 40px)",
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: "-0.04em",
              marginBottom: 10,
            }}
          >
            Analyze your market
          </h1>
          <p style={{ color: "#888888", fontSize: 15, lineHeight: 1.6, marginBottom: 40 }}>
            We'll scan live data across the web, scrape competitor sites, and produce a full intelligence report.
          </p>

          {/* Form card */}
          <div
            style={{
              background: "#0E0E0E",
              border: "1px solid #1A1A1A",
              borderRadius: 12,
              padding: "28px 28px 24px",
            }}
          >
            {/* Idea textarea */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#888888",
                  letterSpacing: "0.06em",
                  marginBottom: 10,
                }}
              >
                STARTUP IDEA
              </label>
              <textarea
                ref={ideaRef}
                value={idea}
                onChange={(e) => { setIdea(e.target.value); setError(null); }}
                onKeyDown={handleKey}
                rows={4}
                placeholder="e.g. AI tool for lawyers to summarize contracts and flag risky clauses"
                disabled={loading}
                style={{
                  width: "100%",
                  background: "#111111",
                  border: "1px solid #2A2A2A",
                  borderRadius: 8,
                  padding: "14px 16px",
                  fontSize: 14,
                  fontFamily: "var(--font-body), Inter, sans-serif",
                  color: "#F5F5F5",
                  outline: "none",
                  resize: "none",
                  lineHeight: 1.6,
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                  opacity: loading ? 0.6 : 1,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#6366F1"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#2A2A2A"; }}
              />
            </div>

            {/* Target market */}
            <div style={{ marginBottom: 28 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#888888",
                  letterSpacing: "0.06em",
                  marginBottom: 10,
                }}
              >
                TARGET MARKET
              </label>
              <input
                type="text"
                value={targetMarket}
                onChange={(e) => { setTargetMarket(e.target.value); setError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") void handleSubmit(); }}
                placeholder="e.g. Small law firms in the US with 2–20 attorneys"
                disabled={loading}
                style={{
                  width: "100%",
                  background: "#111111",
                  border: "1px solid #2A2A2A",
                  borderRadius: 8,
                  padding: "13px 16px",
                  fontSize: 14,
                  fontFamily: "var(--font-body), Inter, sans-serif",
                  color: "#F5F5F5",
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                  opacity: loading ? 0.6 : 1,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#6366F1"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#2A2A2A"; }}
              />
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    color: "#EF4444",
                    fontSize: 13,
                    marginBottom: 16,
                    fontWeight: 500,
                  }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              whileHover={loading ? {} : { opacity: 0.88 }}
              whileTap={loading ? {} : { scale: 0.98 }}
              onClick={() => !loading && void handleSubmit()}
              style={{
                width: "100%",
                background: loading ? "#3730A3" : "#6366F1",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "14px",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "var(--font-body), Inter, sans-serif",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 0 32px rgba(99,102,241,0.3)",
                transition: "background 0.2s, box-shadow 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <AnimatePresence mode="wait">
                  <motion.span
                    key={msgIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <LoadingDots />
                    {LOADING_MESSAGES[msgIndex]}
                  </motion.span>
                </AnimatePresence>
              ) : (
                "Analyze My Market →"
              )}
            </motion.button>

            <p
              style={{
                textAlign: "center",
                color: "#444444",
                fontSize: 11,
                marginTop: 14,
                fontWeight: 500,
              }}
            >
              ⌘ + Enter to submit · Results in ~60 seconds
            </p>
          </div>

          {/* Progress steps during load */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ marginTop: 24 }}
              >
                {LOADING_MESSAGES.map((msg, i) => (
                  <motion.div
                    key={msg}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 4.5 + 0.5 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom: i < LOADING_MESSAGES.length - 1 ? "1px solid #111111" : "none",
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 4.5 + 0.5, type: "spring" }}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: msgIndex > i ? "#10B981" : msgIndex === i ? "#6366F1" : "#1A1A1A",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        flexShrink: 0,
                        transition: "background 0.3s",
                      }}
                    >
                      {msgIndex > i ? "✓" : ""}
                    </motion.div>
                    <span
                      style={{
                        fontSize: 13,
                        color: msgIndex >= i ? "#9CA3AF" : "#444444",
                        fontWeight: msgIndex === i ? 600 : 400,
                        transition: "color 0.3s",
                      }}
                    >
                      {msg}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          style={{
            display: "inline-block",
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#FFFFFF",
          }}
        />
      ))}
    </span>
  );
}
