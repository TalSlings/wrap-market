"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  ["bug", "בעיה באתר"],
  ["accessibility", "בעיית נגישות"],
  ["feature", "הצעה לשיפור"],
  ["other", "אחר"],
] as const;

export default function FeedbackForm({
  sourcePath = "",
}: {
  sourcePath?: string;
}) {
  const [category, setCategory] = useState("bug");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const cleanMessage = message.trim();
    const cleanEmail = contactEmail.trim();

    if (cleanMessage.length < 3) {
      setStatusMessage("כתבי כמה מילים על הבעיה או ההצעה.");
      return;
    }

    setBusy(true);
    setStatusMessage("");

    const s = createClient();
    const {
      data: { user },
    } = await s.auth.getUser();

    const { error } = await s.from("feedback_items").insert({
      category,
      message: cleanMessage,
      contact_email: cleanEmail || null,
      source_path: sourcePath || null,
      user_id: user?.id || null,
      status: "new",
    });

    setBusy(false);

    if (error) {
      setStatusMessage(
        "לא הצלחנו לשלוח את הפנייה. אפשר לנסות שוב בעוד רגע."
      );
      return;
    }

    setMessage("");
    setContactEmail("");
    setStatusMessage("תודה, הפנייה נשלחה.");
  }

  return (
    <form onSubmit={submit} className="section">
      <div className="field">
        <label htmlFor="feedback-category">סוג הפנייה</label>
        <select
          id="feedback-category"
          className="select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="feedback-message">
          מה קרה או מה היית רוצה לשפר? *
        </label>
        <textarea
          id="feedback-message"
          className="input"
          rows={7}
          required
          maxLength={5000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="feedback-email">
          מייל לחזרה — אופציונלי
        </label>
        <input
          id="feedback-email"
          className="input"
          type="email"
          autoComplete="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />
      </div>

      {sourcePath && (
        <p className="muted">
          הפנייה נשלחת מעמוד: <span dir="ltr">{sourcePath}</span>
        </p>
      )}

      <button
        type="submit"
        className="btn primary"
        disabled={busy}
      >
        {busy ? "שולחת..." : "שליחת פנייה"}
      </button>

      <div
        role="status"
        aria-live="polite"
        style={{ marginTop: 10 }}
      >
        {statusMessage}
      </div>
    </form>
  );
}
