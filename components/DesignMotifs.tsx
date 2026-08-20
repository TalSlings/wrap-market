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
        d="M2 22 C58 22 82 22 102 22 C116 22 119 8 130 8 C142 8 145 25 132 26 C120 27 117 17 124 13 C134 7 142 22 157 22 C184 22 215 22 258 22"
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
  type: "vegan" | "natural" | "shipping";
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
  const label = natural ? "סיבים טבעיים" : "טבעוני";

  return (
    <span
      className="feature-badge"
      role="img"
      aria-label={label}
      title={label}
    >
      {natural ? "N" : "V"}
    </span>
  );
}
