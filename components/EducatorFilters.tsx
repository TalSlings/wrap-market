"use client";

import Link from "next/link";
import { useState } from "react";
import type { Region, Subregion } from "@/lib/educators";

export default function EducatorFilters({
  regions, subregions, initialRegionId, initialSubregionId,
}: {
  regions: Region[];
  subregions: Subregion[];
  initialRegionId: string;
  initialSubregionId: string;
}) {
  const [regionId, setRegionId] = useState(initialRegionId);
  const [subregionId, setSubregionId] = useState(initialSubregionId);
  return (
    <form className="educator-filters" method="get" action="/educators">
      <label htmlFor="educator-region">אזור בארץ</label>
      <select id="educator-region" name="region" value={regionId}
        onChange={(event) => {
          setRegionId(event.target.value);
          setSubregionId("");
        }}>
        <option value="">כל האזורים</option>
        {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
      <label htmlFor="educator-subregion">תת־אזור</label>
      <select id="educator-subregion" name="subregion" value={subregionId}
        disabled={!regionId} onChange={(event) => setSubregionId(event.target.value)}>
        <option value="">כל תתי־האזורים</option>
        {subregions.filter((s) => s.region_id === regionId).map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <button className="btn" type="submit">הצגת מדריכות</button>
      {(initialRegionId || initialSubregionId) && <Link href="/educators">ניקוי סינון</Link>}
    </form>
  );
}
