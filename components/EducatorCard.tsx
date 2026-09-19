import Link from "next/link";
import { PawnAvatar } from "@/components/PawnAvatar";
import { pawnAvatarForSeed } from "@/lib/pawnAvatarSeed";
import type { Educator, Region, Subregion } from "@/lib/educators";
import { formatCompactServiceAreas, hasMeaningfulText, safeWebUrl } from "@/lib/educators";

export default function EducatorCard({ educator, regions, subregions }: {
  educator: Educator; regions?: Region[]; subregions?: Subregion[];
}) {
  regions = regions || [];
  subregions = subregions || [];
  const photo = safeWebUrl(educator.photo_url);
  const areas = formatCompactServiceAreas(educator, regions, subregions);
  const profession = hasMeaningfulText(educator.related_professions)
    ? educator.related_professions : educator.additional_professions;
  return (
    <Link className={`educator-card${educator.status === "paused" ? " educator-paused" : ""}`}
      href={`/educators/${educator.id}`}>
      <div className="educator-card-heading">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="educator-photo" src={photo} alt="" loading="lazy" />
        ) : <PawnAvatar avatarKey={pawnAvatarForSeed(educator.id)} size={86} decorative />}
        <div>
          <h2>{educator.full_name}</h2>
          {educator.brand_name && <p className="educator-brand">{educator.brand_name}</p>}
          {educator.status === "paused" && <span className="educator-paused-label">לא מקבלת קהל</span>}
          {areas && <p className="educator-card-areas">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
            <span>{areas}</span>
          </p>}
        </div>
      </div>
      {hasMeaningfulText(educator.card_intro) && <p className="educator-card-intro">{educator.card_intro}</p>}
      {hasMeaningfulText(educator.training) && <p className="educator-card-training">
        <strong>הכשרה:</strong> {educator.training}
      </p>}
      {hasMeaningfulText(profession) && <p className="educator-card-profession">
        <strong>{hasMeaningfulText(educator.related_professions) ? "מקצועות משיקים:" : "מקצועות נוספים:"}</strong> {profession}
      </p>}
    </Link>
  );
}
