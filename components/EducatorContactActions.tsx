"use client";

import { useState } from "react";

type Contact = { phone: string | null; whatsapp: string | null };

export default function EducatorContactActions({ educatorId, educatorName, email, compact = false }: {
  educatorId: string; educatorName: string; email: string | null; compact?: boolean;
}) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function loadContact() {
    if (contact) return contact;
    setLoading(true); setError(false);
    try {
      const response = await fetch(`/api/educators/${educatorId}/contact`);
      if (!response.ok) throw new Error();
      const data = await response.json() as Contact;
      setContact(data);
      return data;
    } catch {
      setError(true); return null;
    } finally { setLoading(false); }
  }

  async function openWhatsApp() {
    const data = await loadContact();
    if (!data?.whatsapp) return;
    const message = encodeURIComponent(`היי ${educatorName}, הגעתי אלייך דרך אתר קשרים ואשמח לברר לגבי הדרכת נשיאה.`);
    window.open(`https://wa.me/${data.whatsapp}?text=${message}`, "_blank", "noopener,noreferrer");
  }

  return <div className={`educator-contact-actions${compact ? " compact" : ""}`}>
    <button type="button" className="btn primary" onClick={openWhatsApp} disabled={loading}>
      {loading ? "טוענת…" : "מעבר לוואטסאפ"}
    </button>
    {!contact?.phone ? (
      <button type="button" className="btn" onClick={loadContact} disabled={loading}>הצג טלפון</button>
    ) : <a className="btn" href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`}>{contact.phone}</a>}
    {email && <a className="btn" href={email}>שליחת מייל</a>}
    {error && <span className="educator-contact-error" role="status">לא הצלחנו להציג את המספר כרגע.</span>}
  </div>;
}
