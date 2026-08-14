"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AccountClient({
  listings,
  searches,
  email,
  provider,
}: {
  listings: any[];
  searches: any[];
  email: string;
  provider: string;
}) {
  const s = createClient();

  const logout = async () => {
    await s.auth.signOut();
    location.href = "/login";
  };

  const stat = async (id: string, status: string) => {
    await s
      .from("listings")
      .update({
        status,
        paused_at: status === "paused" ? new Date().toISOString() : null,
        deleted_at: status === "deleted" ? new Date().toISOString() : null,
      })
      .eq("id", id);

    location.reload();
  };

  const dup = async (l: any) => {
    const c = {
      owner_id: l.owner_id,
      manufacturer_id: l.manufacturer_id,
      design: l.design,
      model: l.model,
      price: l.price,
      description: l.description,
      size: l.size,
      size_note: l.size_note,
      gsm: l.gsm,
      condition: l.condition,
      defects: l.defects,
      defects_description: l.defects_description,
      shipping_available: l.shipping_available,
      more_info_url: l.more_info_url,
      colors: l.colors,
      color_patterns: l.color_patterns,
      status: "draft",
    };

    const { data, error } = await s
      .from("listings")
      .insert(c)
      .select("id")
      .single();

    if (!error && data) {
      location.href = `/listing/${data.id}/edit`;
    }
  };

  return (
    <>
      <div className="section">
        <strong>מחוברת כ־</strong>
        <div>{email}</div>
        <div className="muted">באמצעות {provider}</div>
      </div>

      <div className="toolbar">
        <button className="btn" onClick={logout}>
          התנתקות
        </button>
      </div>

      <div className="section">
        <h2>המודעות שלי</h2>

        {listings.map((l) => (
          <div
            key={l.id}
            className={
              "section account-card " + (l.status === "paused" ? "paused" : "")
            }
          >
            <b>
              {l.manufacturer?.name} · {l.design}
            </b>{" "}
            <span className="badge">
              {l.status === "draft"
                ? "טיוטה"
                : l.status === "paused"
                  ? "מושהית"
                  : "פעילה"}
            </span>

            <p className="count">
              חשיפות {l.impressions_count} · צפיות {l.views_count} · מועדפים{" "}
              {l.favorites_count}
            </p>

            <div className="toolbar">
              <Link className="btn" href={`/listing/${l.id}`}>
                צפייה
              </Link>

              <Link className="btn" href={`/listing/${l.id}/edit`}>
                עריכה
              </Link>

              {l.status === "active" && (
                <button
                  className="btn"
                  onClick={() => stat(l.id, "paused")}
                >
                  השהיה
                </button>
              )}

              {l.status === "paused" && (
                <button
                  className="btn"
                  onClick={() => stat(l.id, "active")}
                >
                  הפעלה מחדש
                </button>
              )}

              <button className="btn" onClick={() => dup(l)}>
                שכפול
              </button>

              <button
                className="btn danger"
                onClick={() => stat(l.id, "deleted")}
              >
                מחיקה
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="section">
        <h2>החיפושים שלי</h2>

        {searches.map((x) => (
          <p key={x.id}>
            <button
              className="btn"
              onClick={() => {
                const raw = JSON.stringify({
                  ...(x.filters || {}),
                  sort: x.sort_key,
                });

                location.href = `/?shared=${encodeURIComponent(
                  btoa(unescape(encodeURIComponent(raw)))
                )}`;
              }}
            >
              {x.name}
            </button>
          </p>
        ))}
      </div>
    </>
  );
}
