"use client";

import { useState } from "react";

export default function ShareButton({
  url,
  title = "רק ארוגים (וטבעות)",
  text,
  label = "שיתוף",
  compact = false,
  className = "",
}: {
  url?: string;
  title?: string;
  text?: string;
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const target = url
      ? new URL(url, location.origin).toString()
      : location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: target });
        return;
      } catch (error: any) {
        if (error?.name === "AbortError") return;
      }
    }

    await navigator.clipboard.writeText(target);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      className={`${compact ? "share-icon-btn" : "btn"} ${className}`.trim()}
      onClick={share}
      aria-label={compact ? label : undefined}
      title={compact ? label : undefined}
    >
      <svg
        className="share-arrow-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="18" cy="5" r="2.5" />
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="19" r="2.5" />
        <path d="m8.2 10.8 7.6-4.4" />
        <path d="m8.2 13.2 7.6 4.4" />
      </svg>
      {!compact && <span>{copied ? "הקישור הועתק" : label}</span>}
    </button>
  );
}
