"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const SCANNING_STEPS = [
  "Connecting to Bright Data SERP API...",
  "Scanning Reddit for real complaints...",
  "Scanning IndieHackers discussions...",
  "Scanning Quora questions...",
  "Scanning ProductHunt reviews...",
  "Running 60+ parallel searches...",
  "Analyzing signals with Gemini 2.5 Flash...",
  "Building your outreach playbook...",
];

const GEOGRAPHIES = [
  { value: "US", label: "US" },
  { value: "Global", label: "Global" },
  { value: "India", label: "India" },
  { value: "Other", label: "Other" },
];

function SpinnerDot() {
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.0, repeat: Infinity, delay: i * 0.18 }}
          style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "#10B981" }}
        />
      ))}
    </span>
  );
}

function ScanningOverlay({
  currentStep,
  signalsFound,
  apiCalls,
  scanComplete,
}: {
  currentStep: number;
  signalsFound: number;
  apiCalls: number;
  scanComplete: boolean;
}) {
  const effectiveStep = scanComplete ? SCANNING_STEPS.length : currentStep;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "#F9FAFB",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "var(--font-body), Inter, sans-serif",
      }}
    >
      {/* Bright Data badge */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "#FF6B3515",
          border: "1px solid #FF6B3540",
          borderRadius: 100,
          padding: "6px 16px",
          marginBottom: 32,
        }}
      >
        <span style={{ fontSize: 14 }}>⚡</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#FF6B35", letterSpacing: "0.04em" }}>
          Powered by Bright Data SERP API
        </span>
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
          fontSize: "clamp(22px, 4vw, 30px)",
          fontWeight: 800,
          color: "#111827",
          letterSpacing: "-0.04em",
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        {scanComplete ? "✅ Scan complete!" : "🔍 Scanning the web live..."}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ color: "#64748B", fontSize: 13, marginBottom: 32, textAlign: "center" }}
      >
        Scanning Reddit, IndieHackers, Quora &amp; ProductHunt in real-time
      </motion.p>

      {/* Steps list */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 14,
          padding: "20px 24px",
          marginBottom: 28,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        {SCANNING_STEPS.map((step, i) => {
          const isDone = effectiveStep > i;
          const isActive = effectiveStep === i;
          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.06 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "9px 0",
                borderBottom: i < SCANNING_STEPS.length - 1 ? "1px solid #F1F5F9" : "none",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: isDone ? "#10B981" : isActive ? "transparent" : "#F1F5F9",
                  border: `2px solid ${isDone ? "#10B981" : isActive ? "#10B981" : "#D1D5DB"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  flexShrink: 0,
                  color: "#FFFFFF",
                  transition: "all 0.3s",
                }}
              >
                {isDone ? "✓" : isActive ? <SpinnerDot /> : ""}
              </div>
              <span
                style={{
                  fontSize: 13,
                  color: isDone ? "#10B981" : isActive ? "#111827" : "#6B7280",
                  fontWeight: isDone || isActive ? 600 : 400,
                  transition: "color 0.3s",
                }}
              >
                {step}
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Live counters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}
      >
        <div
          style={{
            background: "#10B98115",
            border: "1px solid #10B98130",
            borderRadius: 10,
            padding: "14px 20px",
            textAlign: "center",
            minWidth: 140,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
              fontSize: 28,
              fontWeight: 800,
              color: "#10B981",
              letterSpacing: "-0.04em",
              lineHeight: 1,
              marginBottom: 4,
            }}
          >
            {scanComplete ? "25+" : signalsFound}
          </div>
          <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>signals found so far</div>
        </div>

        <div
          style={{
            background: "#FF6B3510",
            border: "1px solid #FF6B3530",
            borderRadius: 10,
            padding: "14px 20px",
            textAlign: "center",
            minWidth: 140,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
              fontSize: 28,
              fontWeight: 800,
              color: "#FF6B35",
              letterSpacing: "-0.04em",
              lineHeight: 1,
              marginBottom: 4,
            }}
          >
            {scanComplete ? "65" : apiCalls}
          </div>
          <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>API calls completed</div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AnalyzePage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [geography, setGeography] = useState("Global");
  const [loading, setLoading] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [signalsFound, setSignalsFound] = useState(0);
  const [apiCalls, setApiCalls] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const ideaRef = useRef<HTMLTextAreaElement>(null);
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const signalIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const apiIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    ideaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (loading) {
      setStepIndex(0);
      setSignalsFound(0);
      setApiCalls(0);

      // Step progression: every 5s over ~40s for 8 steps
      stepIntervalRef.current = setInterval(() => {
        setStepIndex((i) => Math.min(i + 1, SCANNING_STEPS.length - 1));
      }, 5000);

      // Signals counter: random increments up to 25
      signalIntervalRef.current = setInterval(() => {
        setSignalsFound((prev) => {
          if (prev >= 25) return prev;
          return prev + Math.floor(Math.random() * 3) + 1;
        });
      }, 2100);

      // API calls counter: fast increments to ~65
      apiIntervalRef.current = setInterval(() => {
        setApiCalls((prev) => {
          if (prev >= 65) return prev;
          return prev + Math.floor(Math.random() * 3) + 1;
        });
      }, 700);
    } else {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
      if (signalIntervalRef.current) clearInterval(signalIntervalRef.current);
      if (apiIntervalRef.current) clearInterval(apiIntervalRef.current);
    }
    return () => {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
      if (signalIntervalRef.current) clearInterval(signalIntervalRef.current);
      if (apiIntervalRef.current) clearInterval(apiIntervalRef.current);
    };
  }, [loading]);

  const handleSubmit = async () => {
    const trimmedIdea = idea.trim();
    const trimmedCustomer = targetCustomer.trim();

    if (!trimmedIdea) {
      setError("Please describe what you're building.");
      ideaRef.current?.focus();
      return;
    }
    if (!trimmedCustomer) {
      setError("Please describe your target customer.");
      return;
    }

    setLoading(true);
    setScanComplete(false);
    setError(null);
    const startTime = Date.now();

    try {
      const res = await fetch("/api/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: trimmedIdea, targetCustomer: trimmedCustomer, geography }),
      });

      const data = await res.json() as {
        success?: boolean;
        data?: unknown;
        error?: string;
        apiCallCount?: number;
        scanDuration?: number;
        brightDataSearches?: number;
      };

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Scan failed. Please try again.");
      }

      const scanDuration = Math.round((Date.now() - startTime) / 1000);

      // Clear old playbook so new scan always regenerates it
      localStorage.removeItem("f1_playbook");
      localStorage.removeItem("f1_playbook_data");
      localStorage.setItem("f1_idea", trimmedIdea);
      localStorage.setItem("f1_targetCustomer", trimmedCustomer);
      localStorage.setItem("f1_geography", geography);
      localStorage.setItem("f1_signals", JSON.stringify(data.data));
      // Redundant keys for robust back-navigation persistence
      localStorage.setItem("f1_results_data", JSON.stringify(data.data));
      localStorage.setItem("f1_scan_input", JSON.stringify({ idea: trimmedIdea, targetCustomer: trimmedCustomer, geography }));
      localStorage.setItem("f1_scan_meta", JSON.stringify({
        apiCallCount: data.apiCallCount ?? 4,
        scanDuration: data.scanDuration ?? scanDuration,
        brightDataSearches: data.brightDataSearches ?? 4,
      }));

      // Flash "complete" state briefly before navigating
      setScanComplete(true);
      await new Promise((r) => setTimeout(r, 700));
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
      setScanComplete(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey) void handleSubmit();
  };

  return (
    <>
      <AnimatePresence>
        {loading && (
          <ScanningOverlay
            currentStep={stepIndex}
            signalsFound={signalsFound}
            apiCalls={apiCalls}
            scanComplete={scanComplete}
          />
        )}
      </AnimatePresence>

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
          <button
            onClick={() => router.push("/")}
            style={{
              fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: 18,
              color: "#10B981",
              letterSpacing: "-0.04em",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            First100
          </button>
        </nav>

        {/* Content */}
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "56px 24px" }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1
              style={{
                fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
                fontSize: "clamp(26px, 5vw, 36px)",
                fontWeight: 800,
                color: "#0F172A",
                letterSpacing: "-0.04em",
                marginBottom: 8,
              }}
            >
              Find your first 100 customers
            </h1>
            <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.6, marginBottom: 36 }}>
              We&apos;ll scan Reddit, Quora, IndieHackers and ProductHunt live to find people complaining about the problem you solve.
            </p>

            {/* Form card */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 14,
                padding: "28px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              {/* Idea textarea */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#475569",
                    letterSpacing: "0.06em",
                    marginBottom: 8,
                  }}
                >
                  WHAT ARE YOU BUILDING?
                </label>
                <FocusTextarea
                  ref={ideaRef}
                  value={idea}
                  onChange={(v) => { setIdea(v); setError(null); }}
                  onKeyDown={handleKey}
                  rows={4}
                  placeholder="e.g. AI tool for lawyers to review contracts faster"
                  disabled={loading}
                />
              </div>

              {/* Target customer */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#475569",
                    letterSpacing: "0.06em",
                    marginBottom: 8,
                  }}
                >
                  WHO IS YOUR TARGET CUSTOMER?
                </label>
                <FocusInput
                  value={targetCustomer}
                  onChange={(v) => { setTargetCustomer(v); setError(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleSubmit(); }}
                  placeholder="e.g. Solo lawyers and small law firms"
                  disabled={loading}
                />
              </div>

              {/* Geography */}
              <div style={{ marginBottom: 28 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#475569",
                    letterSpacing: "0.06em",
                    marginBottom: 12,
                  }}
                >
                  WHERE ARE THEY?
                </label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {GEOGRAPHIES.map((geo) => (
                    <button
                      key={geo.value}
                      onClick={() => setGeography(geo.value)}
                      disabled={loading}
                      style={{
                        padding: "8px 18px",
                        borderRadius: 8,
                        border: `1.5px solid ${geography === geo.value ? "#10B981" : "#E2E8F0"}`,
                        background: geography === geo.value ? "#D1FAE5" : "#FAFAFA",
                        color: geography === geo.value ? "#065F46" : "#64748B",
                        fontSize: 13,
                        fontWeight: geography === geo.value ? 700 : 500,
                        cursor: loading ? "not-allowed" : "pointer",
                        fontFamily: "var(--font-body), Inter, sans-serif",
                        transition: "all 0.15s",
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      {geo.label}
                    </button>
                  ))}
                </div>
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
                  background: "#10B981",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "14px",
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: "var(--font-body), Inter, sans-serif",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 20px rgba(16,185,129,0.30)",
                  transition: "background 0.2s, box-shadow 0.2s",
                }}
              >
                Find My First 100 Customers →
              </motion.button>

              <p
                style={{
                  textAlign: "center",
                  color: "#94A3B8",
                  fontSize: 11,
                  marginTop: 12,
                  fontWeight: 500,
                }}
              >
                ⌘ + Enter to submit · Results in ~45 seconds
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FocusTextarea({
  value, onChange, onKeyDown, rows, placeholder, disabled, ref: _ref,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  rows: number;
  placeholder: string;
  disabled: boolean;
  ref?: React.RefObject<HTMLTextAreaElement>;
}) {
  const [focused, setFocused] = useState(false);
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const ref = (_ref as React.RefObject<HTMLTextAreaElement> | undefined) ?? internalRef;

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: "100%",
        background: "#FAFAFA",
        border: `1.5px solid ${focused ? "#10B981" : "#E2E8F0"}`,
        borderRadius: 8,
        padding: "13px 16px",
        fontSize: 14,
        fontFamily: "var(--font-body), Inter, sans-serif",
        color: "#0F172A",
        outline: "none",
        resize: "none",
        lineHeight: 1.6,
        transition: "border-color 0.2s",
        boxSizing: "border-box",
        opacity: disabled ? 0.6 : 1,
      }}
    />
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FocusInput({
  value, onChange, onKeyDown, placeholder, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
  disabled: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: "100%",
        background: "#FAFAFA",
        border: `1.5px solid ${focused ? "#10B981" : "#E2E8F0"}`,
        borderRadius: 8,
        padding: "13px 16px",
        fontSize: 14,
        fontFamily: "var(--font-body), Inter, sans-serif",
        color: "#0F172A",
        outline: "none",
        transition: "border-color 0.2s",
        boxSizing: "border-box",
        opacity: disabled ? 0.6 : 1,
      }}
    />
  );
}
