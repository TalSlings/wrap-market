import "./globals.css";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SiteFooter from "@/components/SiteFooter";
import { Noto_Sans_Hebrew, Noto_Sans } from "next/font/google";
import type { Metadata } from "next";
import HeaderAuthLink from "@/components/HeaderAuthLink";

const notoHebrew = Noto_Sans_Hebrew({
  subsets: ["hebrew"],
  variable: "--font-hebrew",
  display: "swap",
});

const notoLatin = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ksharim-baby.org.il"),
  title: {
    default: "רק ארוגים (וטבעות) — לוח יד שנייה למנשאים ארוגים",
    template: "%s | רק ארוגים (וטבעות)",
  },
  description:
    "לוח יד שנייה ישראלי למכירה ולקנייה של מנשאים ארוגים ומנשאי טבעות.",
  applicationName: "רק ארוגים (וטבעות)",
  alternates: { canonical: "/" },
  robots: { index: false, follow: true },
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: "רק ארוגים (וטבעות)",
    title: "רק ארוגים (וטבעות) — לוח יד שנייה למנשאים ארוגים",
    description:
      "לוח יד שנייה ישראלי למכירה ולקנייה של מנשאים ארוגים ומנשאי טבעות.",
    url: "/",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "רק ארוגים (וטבעות)",
    description: "לוח יד שנייה ישראלי למנשאים ארוגים ומנשאי טבעות.",
    images: ["/opengraph-image"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="he" dir="rtl">
      <body className={`${notoHebrew.variable} ${notoLatin.variable}`}>
        <div className="shell">
          <header className="header">
            <Link className="logo" href="/" aria-label="דף הבית">
              <span className="logo-lockup" aria-hidden="true">
                <span className="logo-main">רק ארוגים</span>
                <span className="logo-aside">(וטבעות)</span>
              </span>
            </Link>

            <Link className="iconbtn" href="/new">
              ＋ הוספת מודעה
            </Link>

            <HeaderAuthLink initialAuthenticated={Boolean(user)} />
          </header>

          {children}

          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
