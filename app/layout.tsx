import "./globals.css";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "wrap-market",
  description: "לוח יד שנייה למנשאים ארוגים",
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
      <body>
        <div className="shell">
          <header className="header">
            <Link className="logo" href="/">
              wrap-market
            </Link>

            <Link className="iconbtn" href="/new">
              ＋ פרסום
            </Link>

            <Link
              className="iconbtn"
              href={user ? "/account" : "/login"}
            >
              {user ? "אזור אישי" : "כניסה"}
            </Link>
          </header>

          {children}

          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
