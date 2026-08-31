import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SuspendedPage() {
  const s = await createClient();

  const {
    data: { user },
  } = await s.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const { data: isSuspended } =
    await s.rpc("current_user_is_suspended");

  if (!isSuspended) {
    redirect("/account");
  }

  return (
    <main className="page">
      <div className="section">
        <h1>החשבון מושהה</h1>

        <p>
          כרגע אי אפשר לפרסם מודעות חדשות או לערוך
          מודעות קיימות מהחשבון הזה.
        </p>

        <p className="muted">
          עדיין אפשר להיכנס לאזור האישי, לצפות במודעות
          ובמדף, ולראות את שאר האתר.
        </p>

        <div className="toolbar">
          <Link className="btn primary" href="/account">
            חזרה לאזור שלי
          </Link>

          <Link className="btn" href="/">
            חזרה ללוח
          </Link>
        </div>
      </div>
    </main>
  );
}
