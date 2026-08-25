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
      <span aria-hidden="true">↗</span>
      {!compact && <span>{copied ? "הקישור הועתק" : label}</span>}
    </button>
  );
}
