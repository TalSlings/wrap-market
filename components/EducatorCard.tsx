import Link from "next/link";
import { PawnAvatar } from "@/components/PawnAvatar";
import { pawnAvatarForSeed } from "@/lib/pawnAvatarSeed";
import type { Educator } from "@/lib/educators";
import { safeWebUrl } from "@/lib/educators";

export default function EducatorCard({ educator }: { educator: Educator }) {
  const photo = safeWebUrl(educator.photo_url);
  return (
    <article className={`educator-card${educator.status === "paused" ? " educator-paused" : ""}`}>
      <div className="educator-card-heading">
        {photo ? (
          // External photos will be copied into our storage during the vetted import.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="educator-photo" src={photo} alt="" loading="lazy" />
        ) : (
          <PawnAvatar avatarKey={pawnAvatarForSeed(educator.id)} size={86} decorative />
        )}
        <div>
          <h2><Link href={`/educators/${educator.id}`}>{educator.full_name}</Link></h2>
          {educator.status === "paused" && (
            <span className="educator-paused-label">לא מקבלת כרגע</span>
          )}
          {educator.reception_place && <p>{educator.reception_place}</p>}
          {educator.online_available && <p>אפשרות לליווי אונליין</p>}
        </div>
      </div>
      {educator.training && <p className="educator-card-training">{educator.training}</p>}
      <Link className="btn educator-card-link" href={`/educators/${educator.id}`}>
        לפרופיל המדריכה
      </Link>
    </article>
  );
}
