"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ImpressionTracker({
  listingId,
}: {
  listingId: string;
}) {
  const markerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const target = markerRef.current?.parentElement;
    if (!target) return;

    let counted = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (
          !counted &&
          entry?.isIntersecting &&
          entry.intersectionRatio >= 0.35
        ) {
          counted = true;

          createClient().rpc(
            "increment_listing_impression",
            { p_listing_id: listingId }
          );

          observer.disconnect();
        }
      },
      { threshold: [0.35] }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [listingId]);

  return (
    <span
      ref={markerRef}
      aria-hidden="true"
      style={{ display: "none" }}
    />
  );
}
