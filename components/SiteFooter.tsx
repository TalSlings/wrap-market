"use client";

import Link from "next/link";
import ShareButton from "@/components/ShareButton";

export default function SiteFooter() {
  const linkStyle: React.CSSProperties = {
    textDecoration: "underline",
    textUnderlineOffset: 3,
    padding: "4px 6px",
  };

  return (
    <>
      <footer
        style={{
          marginTop: 40,
          padding: "24px 16px 36px",
          borderTop: "1px solid var(--line)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <ShareButton
            url="/"
            label="שתפו את הלוח"
            text="לוח יד שנייה למנשאים ארוגים ומנשאי טבעות"
          />
        </div>

        <nav
          aria-label="קישורים כלליים"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px 14px",
          }}
        >
          <Link href="/accessibility" style={linkStyle}>
            נגישות
          </Link>

          <Link href="/privacy" style={linkStyle}>
            פרטיות
          </Link>

          <Link href="/terms" style={linkStyle}>
            תנאי שימוש
          </Link>

          <Link href="/safety" style={linkStyle}>
            בטיחות
          </Link>
        </nav>
      </footer>

      <style jsx global>{`
        .footer-link {
          text-decoration: underline;
          text-underline-offset: 3px;
          padding: 4px 6px;
        }

        :focus-visible {
          outline: 3px solid var(--focus-color, #4f3bb8);
          outline-offset: 3px;
        }

        summary:focus-visible,
        button:focus-visible,
        a:focus-visible,
        input:focus-visible,
        select:focus-visible,
        textarea:focus-visible {
          border-radius: 4px;
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  );
}
