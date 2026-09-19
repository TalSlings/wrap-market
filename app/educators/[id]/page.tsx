import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PawnAvatar } from "@/components/PawnAvatar";
import { pawnAvatarForSeed } from "@/lib/pawnAvatarSeed";
import {
  emailLink, getDirectoryData, phoneLink, safeWebUrl,
} from "@/lib/educators";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { educators } = await getDirectoryData();
  const educator = educators.find((e) => e.id === id);
  return {
    title: educator ? `המדריכה ${educator.full_name}` : "מדריכה",
    robots: { index: false, follow: false },
  };
}

function Detail({ title, text }: { title: string; text: string | null }) {
  if (!text?.trim()) return null;
  return <section className="educator-detail-section"><h2>{title}</h2><p>{text}</p></section>;
}

export default async function EducatorProfilePage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { educators, regions, subregions } = await getDirectoryData();
  const educator = educators.find((e) => e.id === id);
  if (!educator) notFound();
  const photo = safeWebUrl(educator.photo_url);
  const phone = phoneLink(educator.phone);
  const email = emailLink(educator.contact_email);
  const links = [
    ["אתר", educator.website_url],
    ["Instagram", educator.instagram_url],
    ["Facebook", educator.facebook_url],
    ["רשת חברתית נוספת", educator.other_social_url],
  ].map(([label, url]) => ({ label, url: safeWebUrl(url) }))
    .filter((entry) => entry.url);
  const areaNames = regions.filter((r) => educator.region_ids.includes(r.id))
    .map((r) => r.name);
  const subareaNames = subregions.filter((s) => educator.subregion_ids.includes(s.id))
    .map((s) => s.name);

  return <main className="page educator-profile">
    <Link href="/educators" className="educator-back">חזרה לכל המדריכות</Link>
    <p>אזורי השירות עדיין בבדיקה; כדאי לוודא עם המדריכה היכן היא מקבלת.</p>
    <div className={`educator-profile-header${educator.status === "paused" ? " educator-paused" : ""}`}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} className="educator-profile-photo" alt="" />
      ) : <PawnAvatar avatarKey={pawnAvatarForSeed(educator.id)} size={120} decorative />}
      <div>
        <h1>{educator.full_name}</h1>
        {educator.status === "paused" && <p className="educator-paused-label">
          לא מקבלת כרגע — אפשר עדיין לפנות אליה
        </p>}
        {educator.reception_place && <p>{educator.reception_place}</p>}
      </div>
    </div>

    <div className="educator-detail-layout">
      <div>
        <Detail title="על המדריכה" text={educator.about} />
        <Detail title="ההכשרה שלי" text={educator.training} />
        <Detail title="הגישה שלי בהדרכה ובנשיאה" text={educator.teaching_approach} />
        <Detail title="מקצועות נוספים הקשורים לנשיאה" text={educator.related_professions} />
        <Detail title="מקצועות נוספים" text={educator.additional_professions} />
        <Detail title="פעילות התנדבותית" text={educator.volunteer_work} />
      </div>
      <aside className="educator-detail-aside">
        <h2>הדרכה ויצירת קשר</h2>
        {(areaNames.length > 0 || subareaNames.length > 0) && <div>
          <h3>אזורי שירות</h3>
          {areaNames.length > 0 && <p>{areaNames.join(" · ")}</p>}
          {subareaNames.length > 0 && <p>{subareaNames.join(" · ")}</p>}
        </div>}
        {educator.region_notes && <p>{educator.region_notes}</p>}
        {educator.reception_notes && <p>{educator.reception_notes}</p>}
        {educator.online_available && <p>אפשרות לליווי אונליין</p>}
        {educator.online_notes && <p>{educator.online_notes}</p>}
        {educator.availability_notes && <p>{educator.availability_notes}</p>}
        <div className="educator-contact-links">
          {phone && <a className="btn" href={phone}>טלפון: {educator.phone}</a>}
          {email && <a className="btn" href={email}>שליחת מייל</a>}
          {links.map(({ label, url }) => (
            <a className="btn" href={url!} key={label} target="_blank" rel="noopener noreferrer">
              {label}
            </a>
          ))}
        </div>
      </aside>
    </div>
  </main>;
}
