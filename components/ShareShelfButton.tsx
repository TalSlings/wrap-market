"use client";

import { useState } from "react";

export default function ShareShelfButton() {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "מדף מנשאים",
          url,
        });
        return;
      } catch {}
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      className="btn"
      onClick={share}
    >
      {copied ? "הקישור הועתק" : "שיתוף המדף"}
    </button>
  );
}
