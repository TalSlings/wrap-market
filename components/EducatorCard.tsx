import Link from "next/link";
import { PawnAvatar } from "@/components/PawnAvatar";
import { pawnAvatarForSeed } from "@/lib/pawnAvatarSeed";
import type { Educator, Region, Subregion } from "@/lib/educators";
import { formatCompactServiceAreas, hasMeaningfulText, safeWebUrl, truncateCardText } from "@/lib/educators";

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
      <div className="educator-card-main">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="educator-photo" src={photo} alt="" loading="lazy" />
        ) : <PawnAvatar avatarKey={pawnAvatarForSeed(educator.id)} size={86} decorative />}
        <div className="educator-card-content">
          <h2>{educator.full_name}</h2>
          {educator.brand_name && <p className="educator-brand">{educator.brand_name}</p>}
          {educator.status === "paused" && <span className="educator-paused-label">לא מקבלת קהל</span>}
          {hasMeaningfulText(educator.card_intro) && <p className="educator-card-intro">{educator.card_intro}</p>}
          {hasMeaningfulText(educator.training) && <p className="educator-card-training">
            <svg className="educator-training-icon" aria-hidden="true" viewBox="0 0 24 24">
              <path d="M2.5 8 12 3l9.5 5L12 13 2.5 8Z"/><path d="M6 10.2v4.4c2.7 2 9.3 2 12 0v-4.4M21.5 8v6"/>
            </svg>
            <span className="sr-only">הכשרה: </span><span className="educator-training-text">{educator.training}</span>
          </p>}
          {hasMeaningfulText(profession) && <p className="educator-card-profession">
            <strong>{hasMeaningfulText(educator.related_professions) ? "מקצועות משיקים:" : "מקצועות נוספים:"}</strong>{" "}
            {truncateCardText(profession)}
          </p>}
          {areas && <p className="educator-card-areas">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
            <span>{areas}</span>
          </p>}
        </div>
      </div>
    </Link>
  );
}
