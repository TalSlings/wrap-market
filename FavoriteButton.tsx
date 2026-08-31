"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function FavoriteButton({
  listingId,
  userId,
  initialFavorite = false,
  compact = false,
}: {
  listingId: string;
  userId?: string | null;
  initialFavorite?: boolean;
  compact?: boolean;
}) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      const next = `${location.pathname}${location.search}`;
      location.href = `/login?next=${encodeURIComponent(next)}`;
      return;
    }

    if (busy) return;
    setBusy(true);

    const s = createClient();

    if (favorite) {
      const { error } = await s
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("listing_id", listingId);

      if (!error) setFavorite(false);
    } else {
      const { error } = await s
        .from("favorites")
        .insert({
          user_id: userId,
          listing_id: listingId,
        });

      if (!error) setFavorite(true);
    }

    setBusy(false);
  }

  return (
    <button
      type="button"
      className="btn"
      onClick={toggle}
      disabled={busy}
      aria-pressed={favorite}
      aria-label={favorite ? "הסרה מהמועדפים" : "הוספה למועדפים"}
      title={favorite ? "הסרה מהמועדפים" : "הוספה למועדפים"}
      style={
        compact
          ? {
              width: 38,
              height: 38,
              padding: 0,
              borderRadius: 999,
              fontSize: 23,
              lineHeight: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }
          : undefined
      }
    >
      {favorite ? "♥" : "♡"}
      {!compact && (
        <span>{favorite ? " במועדפים" : " הוספה למועדפים"}</span>
      )}
    </button>
  );
}
