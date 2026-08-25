"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { HierarchicalMultiSelect } from "@/components/HierarchicalSelect";
import { WovenCorner } from "@/components/DesignMotifs";
import ShareButton from "@/components/ShareButton";

type Tab =
  | "profile"
  | "listings"
  | "favorites"
  | "searches";

export default function AccountClient({
  userId,
  listings,
  searches,
  favorites,
  profile,
  regions,
  subregions,
  email,
  provider,
  isAdmin,
  sellerPublicId,
  isSuspended,
  allowIncomplete,
}: {
  userId: string;
  listings: any[];
  searches: any[];
  favorites: any[];
  profile: any | null;
  regions: any[];
  subregions: any[];
  email: string;
  provider: string;
  isAdmin: boolean;
  sellerPublicId: string | null;
  isSuspended: boolean;
  allowIncomplete: boolean;
}) {
  const s = createClient();

  const [tab, setTab] = useState<Tab>("listings");
  const [displayName, setDisplayName] = useState(
    profile?.display_name || ""
  );
  const [contactEmail, setContactEmail] = useState(
    profile?.contact_email || ""
  );
  const [whatsappNumber, setWhatsappNumber] = useState(
    profile?.whatsapp_number || ""
  );
  const [contactViaEmail, setContactViaEmail] = useState(
    profile?.contact_via_email ?? false
  );
  const [contactViaWhatsapp, setContactViaWhatsapp] =
    useState(
      profile?.contact_via_whatsapp ?? false
    );
  const [shippingAvailable, setShippingAvailable] =
    useState(
      profile?.shipping_available ?? true
    );
  const [regionIds, setRegionIds] = useState<string[]>(
    profile?.region_ids || []
  );
  const [subIds, setSubIds] = useState<string[]>(
    profile?.subregion_ids || []
  );
  const [profileMsg, setProfileMsg] = useState("");

  const regionParents = useMemo(
    () =>
      regions.map((r: any) => ({
        id: r.id,
        name: r.name,
        selectable: true,
      })),
    [regions]
  );

  const regionChildren = useMemo(
    () =>
      subregions.map((x: any) => ({
        id: x.id,
        name: x.name,
        parent_id: x.region_id,
      })),
    [subregions]
  );

  const selectedLocations = useMemo(
    () => [...regionIds, ...subIds],
    [regionIds, subIds]
  );

  const setSelectedLocations = (ids: string[]) => {
    const regionSet = new Set(
      regions.map((r: any) => r.id)
    );
    const subSet = new Set(
      subregions.map((x: any) => x.id)
    );

    setRegionIds(
      ids.filter((id) => regionSet.has(id))
    );
    setSubIds(
      ids.filter((id) => subSet.has(id))
    );
  };

  const logout = async () => {
    await s.auth.signOut();
    location.href = "/login";
  };

  const shareShelf = async () => {
    if (!sellerPublicId) return;

    const url =
      `${location.origin}/seller/${sellerPublicId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "המדף שלי",
          url,
        });
        return;
      } catch {}
    }

    await navigator.clipboard.writeText(url);
    alert("הקישור למדף הועתק");
  };

  const saveProfile = async () => {
    setProfileMsg("");

    if (
      contactViaEmail &&
      !contactEmail.trim()
    ) {
      setProfileMsg(
        "סימנת מייל אבל לא הזנת כתובת."
      );
      return;
    }

    if (
      contactViaWhatsapp &&
      !whatsappNumber.trim()
    ) {
      setProfileMsg(
        "סימנת WhatsApp אבל לא הזנת מספר."
      );
      return;
    }

    const { error } = await s
      .from("user_profiles")
      .upsert(
        {
          user_id: userId,
          display_name:
            displayName.trim() || null,
          contact_email:
            contactEmail.trim() || null,
          whatsapp_number:
            whatsappNumber.trim() || null,
          contact_via_email:
            contactViaEmail,
          contact_via_whatsapp:
            contactViaWhatsapp,
          region_ids: regionIds,
          subregion_ids: subIds,
          shipping_available:
            shippingAvailable,
          updated_at:
            new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    setProfileMsg(
      error
        ? `לא נשמר: ${error.message}`
        : "ברירות המחדל נשמרו"
    );
  };

  const stat = async (
    id: string,
    status: string
  ) => {
    if (isSuspended) {
      alert(
        "החשבון שלך מושהה כרגע ולכן אי אפשר לשנות את מצב המודעות."
      );
      return;
    }

    await s
      .from("listings")
      .update({
        status,
        paused_at:
          status === "paused"
            ? new Date().toISOString()
            : null,
        deleted_at:
          status === "deleted"
            ? new Date().toISOString()
            : null,
      })
      .eq("id", id);

    location.reload();
  };

  const dup = async (l: any) => {
    if (isSuspended) {
      alert(
        "החשבון שלך מושהה כרגע ולכן אי אפשר לשכפל מודעות."
      );
      return;
    }

    const c = {
      owner_id: l.owner_id,
      manufacturer_id:
        l.manufacturer_id,
      design: l.design,
      model: l.model,
      price: l.price,
      description: l.description,
      size: l.size,
      size_note: l.size_note,
      gsm: l.gsm,
      condition: l.condition,
      defects: l.defects,
      defects_description:
        l.defects_description,
      shipping_available:
        l.shipping_available,
      more_info_url: l.more_info_url,
      colors: l.colors,
      color_patterns:
        l.color_patterns,
      contact_name:
        l.contact_name,
      contact_email:
        l.contact_email,
      whatsapp_number:
        l.whatsapp_number,
      contact_via_email:
        l.contact_via_email,
      contact_via_whatsapp:
        l.contact_via_whatsapp,
      status: "draft",
    };

    const { data, error } =
      await s
        .from("listings")
        .insert(c)
        .select("id")
        .single();

    if (!error && data) {
      location.href =
        `/listing/${data.id}/edit`;
    }
  };

  const searchPath = (x: any) => {
    const raw = JSON.stringify({
      ...(x.filters || {}),
      sort: x.sort_key,
    });

    return `/?shared=${encodeURIComponent(
      btoa(
        unescape(
          encodeURIComponent(raw)
        )
      )
    )}`;
  };

  const openSearch = (x: any) => {
    location.href = searchPath(x);
  };

  const tabs: {
    key: Tab;
    label: string;
  }[] = [
    {
      key: "listings",
      label: "המודעות שלי",
    },
    {
      key: "favorites",
      label: "מועדפים",
    },
    {
      key: "searches",
      label: "חיפושים שמורים",
    },
    {
      key: "profile",
      label: "פרטים אישיים",
    },
  ];

  const incompleteListings = allowIncomplete
    ? listings.filter(
        (l: any) => l.status === "incomplete"
      )
    : [];

  const orderedListings = [...listings].sort(
    (a: any, b: any) => {
      if (!allowIncomplete) return 0;

      return (
        Number(b.status === "incomplete") -
        Number(a.status === "incomplete")
      );
    }
  );

  return (
    <>
      {isSuspended && (
        <div
          className="notice"
          role="status"
          style={{ marginBottom: 16 }}
        >
          <strong>החשבון שלך מושהה כרגע.</strong>
          <div style={{ marginTop: 4 }}>
            אפשר להמשיך לצפות במודעות ובמדף שלך, אבל אי אפשר
            לפרסם מודעות חדשות, לערוך מודעות קיימות, לשכפל
            מודעות או להפעיל טיוטות ומודעות מושהות.
          </div>
        </div>
      )}

      <div
        className="toolbar"
        style={{
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        {tabs.map((x) => (
          <button
            type="button"
            key={x.key}
            className={
              "btn " +
              (tab === x.key
                ? "primary"
                : "")
            }
            onClick={() => setTab(x.key)}
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === "listings" && (
        <div className="section">
          <h2>המודעות שלי</h2>

          {allowIncomplete &&
            incompleteListings.length > 0 && (
            <div className="notice" style={{ marginBottom: 14 }}>
              <strong>
                יש לך {incompleteListings.length}{" "}
                {incompleteListings.length === 1
                  ? "מודעה חלקית"
                  : "מודעות חלקיות"}
              </strong>
              <div style={{ marginTop: 4 }}>
                כדאי להשלים את הפרטים כדי שהמודעות יהיו
                ברורות יותר ויופיעו לפני מודעות חלקיות
                בתוצאות החיפוש.
              </div>
            </div>
          )}

          {listings.length === 0 ? (
            <p className="muted">
              אין עדיין מודעות
            </p>
          ) : (
            orderedListings.map((l) => (
              <div
                key={l.id}
                className={
                  "section account-card listing-management-card " +
                  (l.status === "paused"
                    ? "paused"
                    : "") +
                  (allowIncomplete &&
                  l.status === "incomplete"
                    ? " incomplete"
                    : "")
                }
              >
                <WovenCorner />
                <b>
                  {l.manufacturer?.name} ·{" "}
                  {l.design}
                </b>{" "}
                <span className="badge">
                  {l.status === "draft"
                    ? "טיוטה"
                    : l.status === "incomplete"
                      ? allowIncomplete
                        ? "מודעה חלקית"
                        : "טיוטה"
                      : l.status === "paused"
                        ? "מושהית"
                        : "פעילה"}
                </span>

                {allowIncomplete &&
                  l.status === "incomplete" && (
                  <p className="notice">
                    המודעה עדיין חלקית. השלמת הפרטים תעזור
                    לה להיות ברורה וזמינה יותר בחיפוש.
                  </p>
                )}

                <p className="count">
                  לחיצות{" "}
                  {l.clicks_count ?? 0}
                  {" · "}
                  מועדפים{" "}
                  {l.favorites_count ?? 0}
                </p>

                <div className="toolbar">
                  <Link
                    className="btn"
                    href={`/listing/${l.id}`}
                  >
                    צפייה
                  </Link>

                  {["active", "incomplete"].includes(l.status) && (
                    <ShareButton
                      url={`/listing/${l.id}`}
                      title={[l.manufacturer?.name, l.design].filter(Boolean).join(" — ")}
                      label="שיתוף המודעה"
                    />
                  )}

                  {isSuspended ? (
                    <button
                      type="button"
                      className="btn"
                      onClick={() =>
                        alert(
                          "החשבון שלך מושהה כרגע ולכן אי אפשר לערוך מודעות."
                        )
                      }
                    >
                      עריכה
                    </button>
                  ) : (
                    <Link
                      className="btn"
                      href={`/listing/${l.id}/edit`}
                    >
                      {allowIncomplete &&
                      l.status === "incomplete"
                        ? "השלמת פרטים"
                        : "עריכה"}
                    </Link>
                  )}

                  {l.status ===
                    "active" && (
                    <button
                      className="btn"
                      onClick={() =>
                        stat(
                          l.id,
                          "paused"
                        )
                      }
                    >
                      השהיה
                    </button>
                  )}

                  {l.status ===
                    "paused" && (
                    <button
                      className="btn"
                      onClick={() =>
                        stat(
                          l.id,
                          "active"
                        )
                      }
                    >
                      הפעלה מחדש
                    </button>
                  )}

                  <button
                    className="btn"
                    onClick={() => dup(l)}
                  >
                    שכפול
                  </button>

                  <button
                    className="btn danger"
                    onClick={() =>
                      stat(
                        l.id,
                        "deleted"
                      )
                    }
                  >
                    מחיקה
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "favorites" && (
        <div className="section">
          <h2>המועדפים שלי</h2>

          {favorites.length === 0 ? (
            <p className="muted">
              אין עדיין מודעות במועדפים
            </p>
          ) : (
            favorites.map((l) => (
              <div
                key={l.id}
                className="favorite-listing-card"
              >
                <WovenCorner />

                {l.image_url ? (
                  <img
                    className="favorite-listing-img"
                    src={l.image_url}
                    alt=""
                  />
                ) : (
                  <div
                    className="favorite-listing-img favorite-listing-placeholder"
                    aria-label="אין תמונה"
                    role="img"
                  />
                )}

                <div className="favorite-listing-body">
                  {l.manufacturer?.name && (
                    <div className="brand">
                      {l.manufacturer.name}
                    </div>
                  )}

                  {l.design && (
                    <div className="design">
                      {l.design}
                    </div>
                  )}

                  {Number(l.price) > 0 && (
                    <div className="meta">
                      {l.price} ₪
                    </div>
                  )}

                  <Link
                    className="btn favorite-listing-action"
                    href={`/listing/${l.id}`}
                  >
                    לצפייה במודעה
                  </Link>
                  <ShareButton
                    url={`/listing/${l.id}`}
                    title={[l.manufacturer?.name, l.design].filter(Boolean).join(" — ")}
                    label="שיתוף המודעה"
                    compact
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "searches" && (
        <div className="section">
          <h2>החיפושים שלי</h2>

          {searches.length === 0 ? (
            <p className="muted">
              אין עדיין חיפושים שמורים
            </p>
          ) : (
            searches.map((x) => (
              <div
                key={x.id}
                className="section account-card"
              >
                <b>{x.name}</b>

                <div
                  className="toolbar"
                  style={{ marginTop: 8 }}
                >
                  <button
                    className="btn"
                    onClick={() =>
                      openSearch(x)
                    }
                  >
                    פתיחת החיפוש
                  </button>
                  <ShareButton
                    url={searchPath(x)}
                    title={x.name || "חיפוש מנשאים שמור"}
                    label="שיתוף חיפוש"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "profile" && (
        <>
          <div className="section">
            <h2>החשבון שלי</h2>

            <div>
              <strong>מחוברת כ־</strong>
              <div>{email}</div>
              <div className="muted">
                באמצעות {provider}
              </div>
            </div>

            <div
              className="toolbar"
              style={{
                marginTop: 12,
                flexWrap: "wrap",
              }}
            >
              <button
                className="btn"
                onClick={logout}
              >
                התנתקות
              </button>

              {isAdmin && (
                <Link
                  className="btn primary"
                  href="/admin"
                >
                  אזור מנהלות
                </Link>
              )}
            </div>
          </div>

          {sellerPublicId && (
            <div className="section">
              <h2>המדף שלי</h2>

              <p className="muted">
                כאן נמצאות כל המודעות הפעילות
                שלך במקום אחד. אפשר לפתוח את
                המדף או לשתף אותו בקישור אחד.
              </p>

              <div
                className="toolbar"
                style={{
                  flexWrap: "wrap",
                }}
              >
                <Link
                  className="btn"
                  href={`/seller/${sellerPublicId}`}
                >
                  צפייה במדף
                </Link>

                <button
                  type="button"
                  className="btn"
                  onClick={shareShelf}
                >
                  שיתוף המדף
                </button>
              </div>
            </div>
          )}

          <div className="section">
            <h2>ברירות מחדל למודעות</h2>

            <p className="muted">
              הפרטים האלה ימולאו אוטומטית
              במודעות חדשות. תמיד אפשר לשנות
              אותם בתוך מודעה ספציפית.
            </p>

            <div className="field">
              <label>שם להצגה</label>
              <input
                className="input"
                aria-label="שם להצגה"
                value={displayName}
                onChange={(e) =>
                  setDisplayName(
                    e.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>
                <input
                  type="checkbox"
                  checked={contactViaEmail}
                  onChange={(e) =>
                    setContactViaEmail(
                      e.target.checked
                    )
                  }
                />{" "}
                ברירת מחדל: פנייה במייל
              </label>

              {contactViaEmail && (
                <input
                  className="input"
                  type="email"
                  aria-label="מייל ליצירת קשר"
                  value={contactEmail}
                  onChange={(e) =>
                    setContactEmail(
                      e.target.value
                    )
                  }
                  placeholder="מייל ליצירת קשר"
                />
              )}
            </div>

            <div className="field">
              <label>
                <input
                  type="checkbox"
                  checked={
                    contactViaWhatsapp
                  }
                  onChange={(e) =>
                    setContactViaWhatsapp(
                      e.target.checked
                    )
                  }
                />{" "}
                ברירת מחדל: פנייה
                ב־WhatsApp
              </label>

              {contactViaWhatsapp && (
                <input
                  className="input"
                  type="tel"
                  aria-label="מספר WhatsApp ליצירת קשר"
                  value={whatsappNumber}
                  onChange={(e) =>
                    setWhatsappNumber(
                      e.target.value
                    )
                  }
                  placeholder="מספר WhatsApp"
                />
              )}
            </div>

            <HierarchicalMultiSelect
              label="אזורי ברירת מחדל"
              placeholder="בחרי אזורים"
              parents={regionParents}
              children={regionChildren}
              selectedIds={
                selectedLocations
              }
              onChange={
                setSelectedLocations
              }
            />

            <div className="field">
              <label>
                <input
                  type="checkbox"
                  checked={
                    shippingAvailable
                  }
                  onChange={(e) =>
                    setShippingAvailable(
                      e.target.checked
                    )
                  }
                />{" "}
                משלוח זמין כברירת מחדל
              </label>
            </div>

            {profileMsg && (
              <div
                className="notice"
                role="status"
                aria-live="polite"
              >
                {profileMsg}
              </div>
            )}

            <button
              type="button"
              className="btn primary"
              onClick={saveProfile}
            >
              שמירת ברירות מחדל
            </button>
          </div>
        </>
      )}
    </>
  );
}
