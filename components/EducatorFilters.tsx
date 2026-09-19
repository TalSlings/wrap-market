"use client";

import Link from "next/link";
import { useState } from "react";
import type { Region, Subregion } from "@/lib/educators";

export default function EducatorFilters({ regions, subregions, initialRegionId,
  initialSubregionId, initialOnlineOnly }: {
  regions: Region[]; subregions: Subregion[]; initialRegionId: string;
  initialSubregionId: string; initialOnlineOnly?: boolean;
}) {
  initialOnlineOnly = Boolean(initialOnlineOnly);
  const [regionId, setRegionId] = useState(initialRegionId);
  const [subregionId, setSubregionId] = useState(initialSubregionId);
  return (
    <details className="educator-filter-panel"
      open={Boolean(initialRegionId || initialSubregionId || initialOnlineOnly)}>
      <summary>סינון לפי אזור</summary>
      <form className="educator-filters" method="get" action="/educators">
        <label htmlFor="educator-region">אזור</label>
        <select id="educator-region" name="region" value={regionId}
          onChange={(event) => { setRegionId(event.target.value); setSubregionId(""); }}>
          <option value="">כל האזורים</option>
          {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <label htmlFor="educator-subregion">יישוב או תת־אזור</label>
        <select id="educator-subregion" name="subregion" value={subregionId}
          disabled={!regionId} onChange={(event) => setSubregionId(event.target.value)}>
          <option value="">כל האזור</option>
          {subregions.filter((s) => s.region_id === regionId).map((s) =>
            <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <label className="educator-online-filter">
          <input type="checkbox" name="online" value="1" defaultChecked={initialOnlineOnly} />
          מקבלת אונליין
        </label>
        <div className="educator-filter-actions">
          <button className="btn primary" type="submit">הצגת מדריכות</button>
          {(initialRegionId || initialSubregionId || initialOnlineOnly) &&
            <Link href="/educators">ניקוי סינון</Link>}
        </div>
      </form>
    </details>
  );
}
