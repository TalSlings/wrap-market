"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import HeaderAuthLink from "@/components/HeaderAuthLink";
import { getSiteSection } from "@/lib/siteSection";

export default function SiteHeader({
  initialAuthenticated,
  initialUserId,
}: {
  initialAuthenticated: boolean;
  initialUserId: string | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section = getSiteSection(pathname, searchParams);
  const isMarket = section === "market";
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname, searchParams]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <header className={`header site-header site-header-${section}`}>
      <div className="site-menu-root" ref={rootRef}>
        <button
          type="button"
          className="site-menu-trigger"
          aria-label={open ? "סגירת תפריט האתר" : "פתיחת תפריט האתר"}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {open ? (
              <path d="M5 5l14 14M19 5 5 19" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {open && (
          <nav className="site-menu" aria-label="תפריט האתר" role="menu">
            <Link
              href="/educators"
              role="menuitem"
              aria-current={section === "educators" ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <span>מדריכות נשיאה</span>
              <small>חיפוש מדריכה לפי אזור</small>
            </Link>
            <Link
              href="/market"
              role="menuitem"
              aria-current={section === "market" ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <span>שוק יד שנייה</span>
              <small>רק ארוגים (וטבעות)</small>
            </Link>
          </nav>
        )}
      </div>

      <Link
        className={`logo ${isMarket ? "market-logo" : "ksharim-logo"}`}
        href={isMarket ? "/market" : "/educators"}
        aria-label={isMarket ? "רק ארוגים וטבעות — שוק יד שנייה" : "קשרים"}
      >
        {isMarket ? (
          <span className="logo-lockup" aria-hidden="true">
            <span className="logo-main">רק ארוגים</span>
            <span className="logo-aside">(וטבעות)</span>
          </span>
        ) : (
          <span className="logo-lockup" aria-hidden="true">
            <span className="logo-main">קשרים</span>
          </span>
        )}
      </Link>

      {isMarket && (
        <Link className="iconbtn header-new-listing" href="/new">
          <span className="header-new-listing-wide">＋ הוספת מודעה</span>
          <span className="header-new-listing-short">＋ מודעה</span>
        </Link>
      )}

      <HeaderAuthLink
        initialAuthenticated={initialAuthenticated}
        initialUserId={initialUserId}
        signOutDestination={isMarket ? "/market" : "/educators"}
      />
    </header>
  );
}
