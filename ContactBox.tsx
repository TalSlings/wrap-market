"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ContactBox({
  listingId,
  userId,
}: {
  listingId: string;
  userId?: string | null;
}) {
  const [contact, setContact] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;

    createClient()
      .rpc("get_listing_contact", { p_listing_id: listingId })
      .then(({ data }) => {
        setContact(data?.[0] || null);
        setLoaded(true);
      });
  }, [listingId, userId]);

  if (!userId) {
    return (
      <div className="section">
        <h2>יצירת קשר</h2>
        <Link className="btn primary" href={`/login?next=/listing/${listingId}`}>
          התחברי כדי לראות פרטי קשר
        </Link>
      </div>
    );
  }

  if (!loaded) return <div className="section muted">טוענת פרטי קשר...</div>;

  if (!contact?.contact_email && !contact?.whatsapp_number) {
    return (
      <div className="section">
        <h2>יצירת קשר</h2>
        <p className="muted">המפרסמת לא הגדירה דרך יצירת קשר למודעה הזו.</p>
      </div>
    );
  }

  const digits = String(contact.whatsapp_number || "").replace(/\D/g, "");
  const whatsappHref = digits.startsWith("0")
    ? `https://wa.me/972${digits.slice(1)}`
    : `https://wa.me/${digits}`;

  return (
    <div className="section">
      <h2>יצירת קשר</h2>
      {contact.display_name && <p>{contact.display_name}</p>}

      <div className="toolbar">
        {contact.contact_email && (
          <a className="btn" href={`mailto:${contact.contact_email}`}>מייל</a>
        )}
        {contact.whatsapp_number && (
          <a
            className="btn primary"
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
