import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import SiteFooter from "@/components/SiteFooter";
import { Noto_Sans_Hebrew, Noto_Sans } from "next/font/google";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { Suspense } from "react";

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
    default: "קשרים",
    template: "%s | קשרים",
  },
  description: "קשרים — מידע ושירותים קהילתיים בתחום נשיאת התינוקות.",
  applicationName: "קשרים",
  alternates: { canonical: "/" },
  robots: { index: false, follow: true },
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: "קשרים",
    title: "קשרים",
    description: "מידע ושירותים קהילתיים בתחום נשיאת התינוקות.",
    url: "/",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "קשרים",
    description: "מידע ושירותים קהילתיים בתחום נשיאת התינוקות.",
    images: ["/opengraph-image"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Header personalization is visual only. Reading the cookie-backed session
  // avoids a blocking Auth network request on every page; protected routes and
  // database policies continue to perform their own authorization checks.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user || null;

  return (
    <html lang="he" dir="rtl">
      <body className={`${notoHebrew.variable} ${notoLatin.variable}`}>
        <div className="shell">
          <Suspense fallback={<div className="header site-header" aria-hidden="true" />}>
            <SiteHeader
              initialAuthenticated={Boolean(user)}
              initialUserId={user?.id || null}
            />
          </Suspense>

          {children}

          <Suspense fallback={null}>
            <SiteFooter />
          </Suspense>
        </div>
      </body>
    </html>
  );
}
