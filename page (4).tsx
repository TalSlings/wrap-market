import FeedbackForm from "@/components/FeedbackForm";

export const dynamic = "force-dynamic";

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const sp = await searchParams;
  const sourcePath =
    typeof sp.from === "string" ? sp.from.slice(0, 1000) : "";

  return (
    <main className="page">
      <h1>דיווח והצעות לשיפור</h1>

      <p>
        מצאת משהו שלא עובד, בעיית נגישות או רעיון שיכול
        לשפר את הלוח? אפשר לשלוח כאן פנייה.
      </p>

      <p className="muted">
        אין חובה להשאיר מייל. אם תרצי שנוכל לחזור אלייך,
        אפשר להוסיף כתובת מייל בטופס.
      </p>

      <FeedbackForm sourcePath={sourcePath} />
    </main>
  );
}
