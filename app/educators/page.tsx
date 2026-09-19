import type { Metadata } from "next";
import EducatorCard from "@/components/EducatorCard";
import EducatorFilters from "@/components/EducatorFilters";
import { getDirectoryData, orderEducators } from "@/lib/educators";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "מדריכות נשיאה", description: "מדריכות נשיאה לפי אזורי שירות בארץ.",
  robots: { index: false, follow: false },
};

export default async function EducatorsPage({ searchParams }: {
  searchParams: Promise<{ region?: string; subregion?: string; online?: string }>;
}) {
  const [query, { educators, regions, subregions }] = await Promise.all([searchParams, getDirectoryData()]);
  const requestedRegion = regions.find((r) => r.id === query.region) || null;
  const selectedSubregion = subregions.find((s) => s.id === query.subregion &&
    (!requestedRegion || s.region_id === requestedRegion.id)) || null;
  const selectedRegion = requestedRegion || regions.find((r) => r.id === selectedSubregion?.region_id) || null;
  const onlineOnly = query.online === "1";
  const results = orderEducators(educators, regions, subregions, selectedSubregion,
    selectedRegion?.id || null, onlineOnly);
  const direct = results.filter((r) => r.group === "direct");
  const nearby = results.filter((r) => r.group === "nearby");
  const fallback = results.filter((r) => r.group === "fallback");
  const all = results.filter((r) => r.group === "all");

  function cards(rows: typeof results) {
    return <div className="educator-grid">{rows.map(({ educator }) =>
      <EducatorCard key={educator.id} educator={educator} regions={regions} subregions={subregions} />
    )}</div>;
  }

  return <main className="page educator-directory">
    <div className="educator-intro"><h1>מדריכות נשיאה</h1></div>
    <EducatorFilters regions={regions} subregions={subregions}
      initialRegionId={selectedRegion?.id || ""} initialSubregionId={selectedSubregion?.id || ""}
      initialOnlineOnly={onlineOnly} />
    <p className="educator-result-count" role="status">{results.length} מדריכות בתוצאות</p>
    {selectedRegion ? <>
      {direct.length > 0 && <section className="educator-result-group exact">
        {selectedSubregion && <h2 className="educator-group-title">מגיעות ל{selectedSubregion.name}</h2>}
        {cards(direct)}
      </section>}
      {nearby.length > 0 && <section className="educator-result-group nearby">
        <h2 className="educator-group-title">מדריכות נוספות בסביבה</h2>{cards(nearby)}
      </section>}
      {fallback.length > 0 && <section className="educator-result-group fallback">
        <h2 className="educator-group-title">מדריכות באזורים סמוכים</h2>{cards(fallback)}
      </section>}
    </> : cards(all)}
    {results.length === 0 && <p className="educator-empty">
      אין כרגע מדריכות באזור הזה. אפשר לנסות אזור סמוך או לחפש ללא סינון.
    </p>}
  </main>;
}
