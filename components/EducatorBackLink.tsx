"use client";

import { useRouter } from "next/navigation";

export default function EducatorBackLink({ className = "" }: { className?: string }) {
  const router = useRouter();

  function goBack() {
    try {
      const referrer = document.referrer ? new URL(document.referrer) : null;
      if (referrer?.origin === window.location.origin && referrer.pathname === "/educators") {
        router.back();
        return;
      }
    } catch {
      // A direct visit has no useful directory history; use the directory root instead.
    }
    router.push("/educators");
  }

  return <button type="button" className={`educator-back-link ${className}`.trim()} onClick={goBack}>
    <span aria-hidden="true">›</span> חזרה לכל המדריכות
  </button>;
}
