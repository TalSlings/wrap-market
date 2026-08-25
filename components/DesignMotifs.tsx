DesignMotifs.tsx


"use client";

export function WovenCorner({
  className = "",
}: {
  className?: string;
}) {
  return (
    <span
      className={`woven-corner ${className}`}
      aria-hidden="true"
    >
      <span className="woven-corner-v" />
      <span className="woven-corner-h" />
      <span className="woven-corner-v woven-corner-v2" />
      <span className="woven-corner-h woven-corner-h2" />
    </span>
  );
}

export function LooseThread({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={`loose-thread ${className}`}
      viewBox="0 0 260 34"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
    >
      <path
        d="M2 22 H108 C118 22 121 20 124 16 C128 10 136 9 140 14 C144 19 140 25 134 25 C128 25 125 21 126 17 C128 11 136 10 142 16 C147 21 151 22 162 22 H258"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FeatureBadge({
  type,
}: {
  type: "vegan" | "natural" | "easycare" | "shipping";
}) {
  if (type === "shipping") {
    return (
      <span
        className="feature-icon shipping-icon"
        role="img"
        aria-label="משלוח זמין"
        title="משלוח זמין"
      >
        <svg
          viewBox="0 0 32 32"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M5 10.5 16 5l11 5.5v12L16 28 5 22.5z" />
          <path d="M5 10.5 16 16l11-5.5M16 16v12M11 7.5l11 5.5" />
        </svg>
      </span>
    );
  }

  const natural = type === "natural";
  const easycare = type === "easycare";
  const label = easycare
    ? "איזיקייר"
    : natural
      ? "סיבים טבעיים"
      : "טבעוני";

  return (
    <span
      className="feature-badge"
      role="img"
      aria-label={label}
      title={label}
    >
      {easycare ? "e" : natural ? "N" : "V"}
    </span>
  );
}
