import Link from "next/link";
import type { Region, Subregion } from "@/lib/educators";

export default function EducatorFilters({ regions, subregions, initialRegionId,
  initialSubregionId, initialOnlineOnly }: {
  regions: Region[]; subregions: Subregion[]; initialRegionId: string;
  initialSubregionId: string; initialOnlineOnly?: boolean;
}) {
  const selectedSubregion=subregions.find((subregion)=>subregion.id===initialSubregionId);
  const selectedRegion=regions.find((region)=>region.id===initialRegionId);
  const selectedLabel=initialOnlineOnly ? "מקבלת אונליין"
    : selectedSubregion?.name || selectedRegion?.name || "סינון לפי אזור";

  return <details className="educator-area-menu">
    <summary>
      <span>{selectedLabel}</span>
      <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m5 7.5 5 5 5-5"/></svg>
    </summary>
    <div className="educator-area-menu-content">
      <Link href="/educators" prefetch={false}
        className={!initialRegionId && !initialSubregionId && !initialOnlineOnly ? "selected" : ""}
        aria-current={!initialRegionId && !initialSubregionId && !initialOnlineOnly ? "page" : undefined}>
        כל המדריכות
      </Link>
      <Link href="/educators?online=1" prefetch={false}
        className={`educator-online-option${initialOnlineOnly ? " selected" : ""}`}
        aria-current={initialOnlineOnly ? "page" : undefined}>
        מקבלת אונליין
      </Link>
      <div className="educator-area-menu-regions">
        {regions.map((region)=><details className="educator-region-menu" key={region.id}
          open={!initialOnlineOnly && region.id===initialRegionId}>
          <summary>
            <span>{region.name}</span>
            <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m5 7.5 5 5 5-5"/></svg>
          </summary>
          <div className="educator-subregion-options">
            <Link href={`/educators?area=r:${region.id}`} prefetch={false}
              className={!initialSubregionId && initialRegionId===region.id ? "selected" : ""}
              aria-current={!initialSubregionId && initialRegionId===region.id ? "page" : undefined}>
              כל אזור {region.name}
            </Link>
            {subregions.filter((subregion)=>subregion.region_id===region.id).map((subregion)=>
              <Link href={`/educators?area=s:${subregion.id}`} prefetch={false}
                key={subregion.id} className={initialSubregionId===subregion.id ? "selected" : ""}
                aria-current={initialSubregionId===subregion.id ? "page" : undefined}>
                {subregion.name}
              </Link>)}
          </div>
        </details>)}
      </div>
    </div>
  </details>;
}

