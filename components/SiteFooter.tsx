"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteFooter() {
  const pathname = usePathname() || "/";
  const feedbackHref =
    `/feedback?from=${encodeURIComponent(pathname)}`;

  return (
    <>
      <footer
        style={{
          marginTop: 40,
          padding: "24px 16px 36px",
          borderTop: "1px solid var(--line)",
        }}
      >
        <nav
          aria-label="קישורים כלליים"
          className="toolbar"
          style={{
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link href="/accessibility">נגישות</Link>
          <Link href={feedbackHref}>דיווח והצעות לשיפור</Link>
          <Link href="/privacy">פרטיות</Link>
          <Link href="/terms">תנאי שימוש</Link>
          <Link href="/safety">בטיחות</Link>
        </nav>
      </footer>

      <style jsx global>{`
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
