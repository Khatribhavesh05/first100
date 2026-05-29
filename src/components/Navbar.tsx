"use client";

import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  return (
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
          color: "#0F172A",
          letterSpacing: "-0.04em",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        First100
      </button>
      <button
        onClick={() => router.push("/analyze")}
        style={{
          background: "#10B981",
          border: "none",
          color: "#FFFFFF",
          padding: "9px 20px",
          borderRadius: 8,
          fontSize: 13,
          fontFamily: "var(--font-body), Inter, sans-serif",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Find My Customers →
      </button>
    </nav>
  );
}
