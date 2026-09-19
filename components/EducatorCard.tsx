import Link from "next/link";
import { PawnAvatar } from "@/components/PawnAvatar";
import { pawnAvatarForSeed } from "@/lib/pawnAvatarSeed";
import type { Educator, Region, Subregion } from "@/lib/educators";
import { formatServiceAreas, safeWebUrl } from "@/lib/educators";

export default function EducatorCard({ educator, regions, subregions }: {
  educator: Educator; regions?: Region[]; subregions?: Subregion[];
}) {
  regions = regions || [];
  subregions = subregions || [];
  const photo = safeWebUrl(educator.photo_url);
  const areas = formatServiceAreas(educator, regions, subregions, true);
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
          {areas && <p className="educator-card-areas">{areas}</p>}
          {educator.online_status === "yes" && <p>מקבלת אונליין</p>}
          {educator.online_status === "special" && <p>מקבלת אונליין במקרים מיוחדים</p>}
        </div>
      </div>
      {educator.card_intro && <p className="educator-card-intro">{educator.card_intro}</p>}
      {educator.training && <p className="educator-card-training">{educator.training}</p>}
    </Link>
  );
}
