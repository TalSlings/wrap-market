"use client";

import { EducatorClaimBox, EducatorProfileEditor } from "@/components/EducatorWorkspace";

export default function EducatorJoinClient({ regions, subregions }: { regions:any[]; subregions:any[] }) {
  return <div className="educator-join-layout">
    <EducatorClaimBox />
    <div className="educator-join-divider"><span>או</span></div>
    <section className="educator-new-application">
      <h2>עדיין אין לך כרטיס?</h2>
      <p>מלאי טיוטה חדשה. לאחר השליחה מנהלת תוכל לאשר אותה או להחזיר אותה עם הערה לתיקון.</p>
      <EducatorProfileEditor regions={regions} subregions={subregions} />
    </section>
  </div>;
}
