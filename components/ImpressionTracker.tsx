"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ImpressionTracker({
  listingId,
}: {
  listingId: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const key = `impression:${listingId}:${new Date()
      .toISOString()
      .slice(0, 10)}`;

    if (sessionStorage.getItem(key)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some(
          (entry) =>
            entry.isIntersecting &&
            entry.intersectionRatio >= 0.35
        );

        if (!visible) return;

        sessionStorage.setItem(key, "1");

        createClient().rpc(
          "increment_listing_impression",
          {
            p_listing_id: listingId,
          }
        );

        observer.disconnect();
      },
      {
        threshold: [0.35],
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [listingId]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: 0,
      }}
    />
  );
}
