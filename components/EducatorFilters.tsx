import Link from "next/link";
import type { Region, Subregion } from "@/lib/educators";

export default function EducatorFilters({ regions, subregions, initialRegionId,
  initialSubregionId, initialOnlineOnly }: {
  regions: Region[]; subregions: Subregion[]; initialRegionId: string;
  initialSubregionId: string; initialOnlineOnly?: boolean;
}) {
  const initialArea=initialSubregionId ? `s:${initialSubregionId}`
    : initialRegionId ? `r:${initialRegionId}` : "";
  return (
    <details className="educator-filter-panel"
      open={Boolean(initialArea || initialOnlineOnly)}>
      <summary>סינון לפי אזור</summary>
      <form className="educator-filters" method="get" action="/educators">
        <label htmlFor="educator-area">איפה מחפשות?</label>
        <select id="educator-area" name="area" defaultValue={initialArea}>
          <option value="">כל האזורים</option>
          {regions.map((region) => <optgroup key={region.id} label={region.name}>
            <option value={`r:${region.id}`}>כל אזור {region.name}</option>
            {subregions.filter((subregion) => subregion.region_id === region.id).map((subregion) =>
              <option key={subregion.id} value={`s:${subregion.id}`}>{subregion.name}</option>)}
          </optgroup>)}
        </select>
        <label className="educator-online-filter">
          <input type="checkbox" name="online" value="1" defaultChecked={Boolean(initialOnlineOnly)} />
          מקבלת אונליין
        </label>
        <div className="educator-filter-actions">
          <button className="btn primary" type="submit">הצגת מדריכות</button>
          {(initialArea || initialOnlineOnly) && <Link href="/educators">ניקוי סינון</Link>}
        </div>
      </form>
    </details>
  );
}

