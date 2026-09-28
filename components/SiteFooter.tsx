"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import ShareButton from "@/components/ShareButton";
import { getSiteSection } from "@/lib/siteSection";

export default function SiteFooter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section = getSiteSection(pathname, searchParams);
  const share = section === "market"
    ? {
        url: "/market",
        title: "רק ארוגים (וטבעות)",
        label: "שיתוף השוק",
        text: "שוק יד שנייה למנשאים ארוגים ומנשאי טבעות",
      }
    : section === "educators"
      ? {
          url: "/educators",
          title: "מדריכות נשיאה | קשרים",
          label: "שיתוף כל המדריכות",
          text: "מאגר מדריכות הנשיאה באתר קשרים",
        }
      : null;
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
        {share && <div style={{ textAlign: "center", marginBottom: 16 }}>
          <ShareButton
            url={share.url}
            title={share.title}
            label={share.label}
            text={share.text}
          />
        </div>}

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

          <Link href="/faq" style={linkStyle}>
            שאלות נפוצות
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
