"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { HierarchicalMultiSelect } from "@/components/HierarchicalSelect";
import { WovenCorner } from "@/components/DesignMotifs";
import ShareButton from "@/components/ShareButton";
import {
  normalizePawnAvatar,
  pawnAvatarForSeed,
  PawnAvatar,
  PawnAvatarPicker,
  type PawnAvatarKey,
} from "@/components/PawnAvatar";
import { sanitizeProfileImage } from "@/lib/image";

type Tab =
  | "profile"
  | "listings"
  | "deleted"
  | "favorites"
  | "searches";

function ShelfIcon() {
  return (
    <svg
      className="shelf-title-icon"
      viewBox="0 0 48 40"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 33.5h38M8 33.5V37M40 33.5V37" />
      <path d="M10 27h28v6.5H10z" />
      <path d="M13 21h22v6H13z" />
      <path d="M17 15h18v6H17z" />
      <path d="M17 18h18M13 24h22M10 30h28" />
    </svg>
  );
}

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
  const s = useMemo(() => createClient(), []);

  const [tab, setTab] = useState<Tab>("profile");
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
  const [identityMsg, setIdentityMsg] = useState("");
  const [avatarKey, setAvatarKey] = useState<PawnAvatarKey>(
    profile?.profile_setup_complete
      ? normalizePawnAvatar(profile?.avatar_key)
      : pawnAvatarForSeed(userId)
  );
  const [profileImagePath, setProfileImagePath] = useState<string | null>(
    profile?.profile_image_path || null
  );
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [avatarMode, setAvatarMode] = useState<"pawn" | "image">(
    profile?.profile_image_path ? "image" : "pawn"
  );
  const [profileSetupComplete, setProfileSetupComplete] = useState(
    !!profile?.profile_setup_complete
  );
  const [editingIdentity, setEditingIdentity] = useState(
    !profile?.profile_setup_complete
  );
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [accountDeleteMsg, setAccountDeleteMsg] = useState("");

  const storedProfileImageUrl = useMemo(() => {
    if (!profileImagePath) return null;
    return s.storage.from("profile-images").getPublicUrl(profileImagePath).data
      .publicUrl;
  }, [profileImagePath, s]);

  useEffect(() => {
    if (!profileImageFile) {
      setProfileImagePreview(null);
      return;
    }

    const url = URL.createObjectURL(profileImageFile);
    setProfileImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [profileImageFile]);

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
          display_name: displayName.trim() || null,
          avatar_key: avatarKey,
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

  const saveIdentity = async () => {
    setIdentityMsg("");

    if (!displayName.trim()) {
      setIdentityMsg("צריך להזין שם או כינוי שיוצג באתר.");
      return;
    }

    setSavingIdentity(true);
    let nextImagePath = avatarMode === "image" ? profileImagePath : null;
    let uploadedPath: string | null = null;

    try {
      if (avatarMode === "image" && profileImageFile) {
        if (profileImageFile.size > 15 * 1024 * 1024) {
          throw new Error("התמונה גדולה מדי. אפשר לבחור תמונה בגודל של עד 15MB.");
        }

        const blob = await sanitizeProfileImage(profileImageFile);
        uploadedPath = `${userId}/profile-${Date.now()}.jpg`;
        const { error: uploadError } = await s.storage
          .from("profile-images")
          .upload(uploadedPath, blob, {
            contentType: "image/jpeg",
            upsert: false,
          });
        if (uploadError) throw uploadError;
        nextImagePath = uploadedPath;
      }

      const { error } = await s
        .from("user_profiles")
        .upsert(
          {
            user_id: userId,
            display_name: displayName.trim(),
            avatar_key: avatarKey,
            profile_image_path: nextImagePath,
            profile_setup_complete: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      if (error) throw error;

      if (profileImagePath && profileImagePath !== nextImagePath) {
        await s.storage.from("profile-images").remove([profileImagePath]);
      }

      setProfileImagePath(nextImagePath);
      setProfileImageFile(null);
      setProfileSetupComplete(true);
      setEditingIdentity(false);
      setIdentityMsg("");
    } catch (error) {
      if (uploadedPath) {
        await s.storage.from("profile-images").remove([uploadedPath]);
      }
      setIdentityMsg(
        `לא נשמר: ${error instanceof Error ? error.message : "שגיאה לא ידועה"}`
      );
    } finally {
      setSavingIdentity(false);
    }
  };

  const choosePawn = (key: PawnAvatarKey) => {
    setAvatarKey(key);
    setAvatarMode("pawn");
  };

  const chooseProfileImage = (file: File | null) => {
    if (!file) return;
    setProfileImageFile(file);
    setAvatarMode("image");
    setIdentityMsg("");
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

    if (
      status === "deleted" &&
      !confirm(
        "המודעה תוסר מיד מהאתר ותישמר בסל המיחזור למשך 60 יום. בתקופה הזו אפשר לשחזר אותה. להמשיך?"
      )
    ) {
      return;
    }

    const { error } = await s
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

    if (error) {
      alert(`לא הצלחנו לעדכן את המודעה: ${error.message}`);
      return;
    }

    location.reload();
  };

  const deleteAccount = async () => {
    setAccountDeleteMsg("");

    if (
      !confirm(
        "מחיקת החשבון היא סופית. כל המודעות, התמונות, המועדפים והחיפושים השמורים יימחקו ולא יהיה אפשר לשחזר אותם. להמשיך?"
      )
    ) {
      return;
    }

    if (!confirm("אישור אחרון: למחוק את החשבון לצמיתות?")) {
      return;
    }

    setDeletingAccount(true);
    const response = await fetch("/api/account/delete", { method: "POST" });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setDeletingAccount(false);
      setAccountDeleteMsg(
        body?.error || "לא הצלחנו למחוק את החשבון. אפשר לפנות לתמיכה."
      );
      return;
    }

    location.href = "/?accountDeleted=1";
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
      key: "profile",
      label: "אזור אישי",
    },
    {
      key: "listings",
      label: "המודעות שלי",
    },
    {
      key: "deleted",
      label: "סל מיחזור",
    },
    {
      key: "favorites",
      label: "מועדפים",
    },
    {
      key: "searches",
      label: "חיפושים שמורים",
    },
  ];

  const activeListings = listings.filter(
    (l: any) => l.status !== "deleted"
  );

  const deletedListings = listings.filter(
    (l: any) => l.status === "deleted"
  );

  const incompleteListings = allowIncomplete
    ? activeListings.filter(
        (l: any) => l.status === "incomplete"
      )
    : [];

  const orderedListings = [...activeListings].sort(
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

          {activeListings.length === 0 ? (
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

      {tab === "deleted" && (
        <div className="section">
          <h2>סל מיחזור</h2>
          <p className="muted">
            מודעה שנמחקה מוסתרת מיד מהאתר. אפשר לשחזר אותה במשך 60 יום;
            לאחר מכן היא והתמונות שלה נמחקות לצמיתות.
          </p>

          {deletedListings.length === 0 ? (
            <p className="muted">סל המיחזור ריק</p>
          ) : (
            deletedListings.map((l: any) => {
              const deletedAt = l.deleted_at ? new Date(l.deleted_at) : null;
              const daysLeft = deletedAt
                ? Math.max(
                    0,
                    Math.ceil(
                      (deletedAt.getTime() + 60 * 86400000 - Date.now()) /
                        86400000
                    )
                  )
                : 60;

              return (
                <div key={l.id} className="section account-card">
                  <WovenCorner />
                  <b>{l.manufacturer?.name} · {l.design}</b>
                  <p className="muted">
                    נותרו עד {daysLeft} ימים לשחזור.
                  </p>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => stat(l.id, "paused")}
                  >
                    שחזור המודעה
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "favorites" && (
        <div className="section">
          <h2>המועדפים שלי - מודעות ששמרתי</h2>

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
                    width={110}
                    height={120}
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

                  <div className="favorite-listing-actions">
                    <Link
                      className="btn favorite-listing-action"
                      href={`/listing/${l.id}`}
                    >
                      לצפייה במודעה
                    </Link>
                    <ShareButton
                      url={`/listing/${l.id}`}
                      title={[l.manufacturer?.name, l.design].filter(Boolean).join(" — ")}
                      label="שיתוף מודעה"
                    />
                  </div>
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
          <div className="section profile-identity profile-card-part profile-card-first">
            <h2 className="profile-account-title">הפרופיל והחשבון שלי</h2>
            {!editingIdentity ? (
              <div className="profile-identity-summary">
                {avatarMode === "image" && storedProfileImageUrl ? (
                  <img
                    className="profile-avatar-image"
                    src={storedProfileImageUrl}
                    alt="תמונת הפרופיל"
                    width={96}
                    height={96}
                  />
                ) : (
                  <PawnAvatar avatarKey={avatarKey} size={96} />
                )}
                <div>
                  <h3>{displayName || "הפרופיל שלי"}</h3>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setEditingIdentity(true)}
                  >
                    עריכת הפרופיל
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="profile-identity-heading">
                  {avatarMode === "image" &&
                  (profileImagePreview || storedProfileImageUrl) ? (
                    <img
                      className="profile-avatar-image"
                      src={profileImagePreview || storedProfileImageUrl || ""}
                      alt="תצוגה מקדימה של תמונת הפרופיל"
                      width={96}
                      height={96}
                    />
                  ) : (
                    <PawnAvatar avatarKey={avatarKey} size={96} />
                  )}
                  <div>
                    <h3>{profileSetupComplete ? "עריכת הפרופיל" : "יצירת פרופיל באתר"}</h3>
                    {!profileSetupComplete && (
                      <p className="muted">
                        אפשר לבחור איך להופיע באתר ולשנות את הפרטים בהמשך.
                      </p>
                    )}
                  </div>
                </div>

                <div className="field">
                  <label>שם/כינוי שיוצג באתר</label>
                  <input
                    className="input"
                    aria-label="שם או כינוי שיוצג באתר"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="שם או כינוי"
                  />
                </div>

                <div className="field">
                  <label htmlFor="profile-image">תמונה אישית</label>
                  <input
                    id="profile-image"
                    className="input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => chooseProfileImage(e.target.files?.[0] || null)}
                  />
                  <div className="field-help">
                    התמונה תיחתך לריבוע ותוצג במדף הציבורי.
                  </div>
                </div>

                <div className="profile-choice-divider"><span>או לבחור פיון</span></div>
                <PawnAvatarPicker value={avatarKey} onChange={choosePawn} />

                {identityMsg && (
                  <div className="notice" role="status" aria-live="polite">
                    {identityMsg}
                  </div>
                )}

                <div className="toolbar">
                  <button
                    type="button"
                    className="btn primary"
                    disabled={savingIdentity}
                    onClick={saveIdentity}
                  >
                    {savingIdentity ? "שומרת..." : "שמירת הפרופיל"}
                  </button>
                  {profileSetupComplete && (
                    <button
                      type="button"
                      className="btn"
                      disabled={savingIdentity}
                      onClick={() => location.reload()}
                    >
                      ביטול
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="section profile-card-part profile-card-middle">
            <h3>פרטי התחברות</h3>

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

          <div className="section profile-card-part profile-card-last">
            <h3>ברירות מחדל למודעות</h3>

            <p className="muted">
              הפרטים האלה ימולאו אוטומטית
              במודעות חדשות. תמיד אפשר לשנות
              אותם בתוך מודעה ספציפית.
            </p>

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

          {sellerPublicId && (
            <div className="section shelf-section">
              <div className="shelf-title">
                <ShelfIcon />
                <h2>המדף שלי</h2>
              </div>

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

                <ShareButton
                  url={`/seller/${sellerPublicId}`}
                  title="המדף שלי"
                  label="שיתוף המדף"
                />
              </div>
            </div>
          )}

          {!isAdmin && (
            <div className="section account-delete-section">
              <h2>מחיקת החשבון</h2>
              <p className="muted">
                מחיקת החשבון תמחק לצמיתות את המודעות, התמונות, המועדפים,
                החיפושים השמורים ופרטי החשבון. אי אפשר לבטל פעולה זו.
              </p>
              <button
                type="button"
                className="btn danger"
                disabled={deletingAccount}
                onClick={deleteAccount}
              >
                {deletingAccount ? "מוחקת..." : "מחיקת החשבון שלי"}
              </button>
              {accountDeleteMsg && (
                <p className="danger" role="alert">{accountDeleteMsg}</p>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
