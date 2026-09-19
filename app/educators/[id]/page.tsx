import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PawnAvatar } from "@/components/PawnAvatar";
import EducatorContactActions from "@/components/EducatorContactActions";
import { pawnAvatarForSeed } from "@/lib/pawnAvatarSeed";
import { emailLink, formatCompactServiceAreas, formatServiceAreas, getDirectoryData,
  hasMeaningfulText, safeWebUrl } from "@/lib/educators";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { educators } = await getDirectoryData();
  const educator = educators.find((e) => e.id === id);
  return { title: educator ? `המדריכה ${educator.full_name}` : "מדריכה",
    robots: { index: false, follow: false } };
}

function Detail({ title, text }: { title: string; text: string | null }) {
  if (!hasMeaningfulText(text)) return null;
  return <section className="educator-detail-section"><h2>{title}</h2><p>{text}</p></section>;
}

export default async function EducatorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { educators, regions, subregions } = await getDirectoryData();
  const educator = educators.find((e) => e.id === id);
  if (!educator) notFound();
  const photo = safeWebUrl(educator.photo_url);
  const email = emailLink(educator.contact_email);
  const compactAreas = formatCompactServiceAreas(educator, regions, subregions);
  const fullAreas = formatServiceAreas(educator, regions, subregions);
  const links = [
    ["אתר", educator.website_url], ["Instagram", educator.instagram_url],
    ["Facebook", educator.facebook_url], ["רשת חברתית נוספת", educator.other_social_url],
  ].map(([label,url]) => ({label,url:safeWebUrl(url)})).filter((entry)=>entry.url);
  const hasProfessional = [educator.training, educator.related_professions,
    educator.additional_professions, educator.volunteer_work].some(hasMeaningfulText);
  const hasPractical = [educator.reception_place, educator.reception_notes, educator.region_notes,
    educator.availability_notes, educator.online_notes].some(hasMeaningfulText) ||
    educator.online_status !== "no";

  return <main className="page educator-profile">
    <div className={`educator-profile-header${educator.status === "paused" ? " educator-paused" : ""}`}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} className="educator-profile-photo" alt="" />
      ) : <PawnAvatar avatarKey={pawnAvatarForSeed(educator.id)} size={120} decorative />}
      <div className="educator-profile-identity">
        <h1>{educator.full_name}</h1>
        {educator.brand_name && <p className="educator-brand">{educator.brand_name}</p>}
        {educator.status === "paused" && <p className="educator-paused-label">לא מקבלת קהל</p>}
        {compactAreas && <p className="educator-profile-areas">{compactAreas}</p>}
        {hasMeaningfulText(educator.card_intro) && <p className="educator-profile-intro">{educator.card_intro}</p>}
      </div>
      <EducatorContactActions educatorId={educator.id} educatorName={educator.full_name} email={email} compact />
    </div>

    {(hasProfessional || links.length > 0) && <div className="educator-professional-layout">
      {hasProfessional && <div>
        <Detail title="הכשרה" text={educator.training} />
        <Detail title="מקצועות משיקים" text={educator.related_professions} />
        <Detail title="מקצועות נוספים" text={educator.additional_professions} />
        <Detail title="פעילות התנדבותית" text={educator.volunteer_work} />
      </div>}
      {links.length > 0 && <aside className="educator-digital-links">
        <h2>אפשר למצוא אותי גם כאן</h2>
        <div className="educator-contact-links">{links.map(({label,url}) =>
          <a className="btn" href={url!} key={label} target="_blank" rel="noopener noreferrer">{label}</a>)}
        </div>
      </aside>}
    </div>}

    {([educator.about,educator.teaching_approach].some(hasMeaningfulText)) && <div className="educator-long-text">
      <Detail title="עליי" text={educator.about} />
      <Detail title="הגישה שלי בהדרכה ובנשיאה" text={educator.teaching_approach} />
    </div>}

    {hasPractical && <section className="educator-practical">
      <h2>מידע שימושי לקראת פנייה</h2>
      {fullAreas && <div><h3>אזורי שירות</h3><p>{fullAreas}</p></div>}
      {hasMeaningfulText(educator.reception_place) && <div><h3>איפה אפשר להגיע אליי?</h3><p>{educator.reception_place}</p></div>}
      {hasMeaningfulText(educator.reception_notes) && <p>{educator.reception_notes}</p>}
      {hasMeaningfulText(educator.region_notes) && <p>{educator.region_notes}</p>}
      {educator.online_status === "yes" && <p><strong>מקבלת אונליין</strong></p>}
      {educator.online_status === "special" && <p><strong>מקבלת אונליין במקרים מיוחדים</strong></p>}
      {hasMeaningfulText(educator.online_notes) && <p>{educator.online_notes}</p>}
      {hasMeaningfulText(educator.availability_notes) && <p>{educator.availability_notes}</p>}
    </section>}
    <EducatorContactActions educatorId={educator.id} educatorName={educator.full_name} email={email} />
    <Link href="/educators" className="btn educator-back-bottom">חזרה לכל המדריכות</Link>
  </main>;
}
