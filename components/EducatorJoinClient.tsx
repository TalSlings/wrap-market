"use client";

import { EducatorClaimBox, EducatorProfileEditor } from "@/components/EducatorWorkspace";

export default function EducatorJoinClient({ regions, subregions }: { regions:any[]; subregions:any[] }) {
  return <div className="educator-join-layout">
    <EducatorClaimBox />
    <div className="educator-join-divider"><span>או</span></div>
    <section className="educator-new-application">
      <h2>עדיין אין לך כרטיס?</h2>
      <p>מספיק למלא שם כדי להתחיל. אפשר להוסיף מה שנוח עכשיו ולהשלים את השאר בהמשך. הכרטיס יופיע במאגר רק אחרי אישור מנהלת.</p>
      <EducatorProfileEditor regions={regions} subregions={subregions} />
    </section>
  </div>;
}
