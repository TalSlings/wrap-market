import Link from "next/link";
import Image from "next/image";
import { PawnAvatar } from "@/components/PawnAvatar";
import { pawnAvatarForSeed } from "@/lib/pawnAvatarSeed";
import type { Educator, Region, Subregion } from "@/lib/educators";
import { educatorLead, formatCompactServiceAreas, hasMeaningfulText, safeWebUrl } from "@/lib/educators";

export default function EducatorCard({ educator, regions, subregions }: {
  educator: Educator; regions?: Region[]; subregions?: Subregion[];
}) {
  regions = regions || [];
  subregions = subregions || [];
  const photo = safeWebUrl(educator.photo_url);
  const areas = formatCompactServiceAreas(educator, regions, subregions);
  const lead = educatorLead(educator, 120);
  const firstName = educator.full_name.trim().split(/\s+/)[0];
  return (
    <Link className={`educator-card${educator.status === "paused" ? " educator-paused" : ""}`}
      href={`/educators/${educator.id}`}>
      <div className="educator-card-photo-wrap">
        {photo?.startsWith("/") ? (
          <Image className="educator-photo" src={photo} alt="" width={192} height={192}
            sizes="(max-width: 650px) calc(100vw - 60px), 42vw" />
        ) : photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="educator-photo" src={photo} alt="" loading="lazy" />
        ) : <PawnAvatar avatarKey={pawnAvatarForSeed(educator.id)} size={112} decorative />}
      </div>
      <div className="educator-card-content">
        <div className="educator-card-identity">
          <h2>{educator.full_name}</h2>
          {educator.brand_name && <p className="educator-brand">{educator.brand_name}</p>}
        </div>
        {educator.status === "paused" && <span className="educator-paused-label">לא מקבלת קהל</span>}
        {lead && <p className="educator-card-intro">{lead}</p>}
        {hasMeaningfulText(educator.training) && <p className="educator-card-training">
          <svg className="educator-training-icon" aria-hidden="true" viewBox="0 0 24 24">
            <path d="M2.5 8 12 3l9.5 5L12 13 2.5 8Z"/><path d="M6 10.2v4.4c2.7 2 9.3 2 12 0v-4.4M21.5 8v6"/>
          </svg>
          <span className="sr-only">הכשרה: </span><span className="educator-training-text">{educator.training}</span>
        </p>}
        <div className="educator-card-footer">
          {areas && <p className="educator-card-areas">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
            <span>{areas}</span>
          </p>}
          <span className="educator-card-invitation">להכיר את {firstName}<span aria-hidden="true"> ←</span></span>
        </div>
      </div>
    </Link>
  );
}
