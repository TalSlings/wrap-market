import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import EducatorBackLink from "@/components/EducatorBackLink";
import { PawnAvatar } from "@/components/PawnAvatar";
import EducatorContactActions from "@/components/EducatorContactActions";
import { pawnAvatarForSeed } from "@/lib/pawnAvatarSeed";
import { educatorLead, emailLink, formatCompactServiceAreas, formatServiceAreas,
  getDirectoryData, hasMeaningfulText, safeWebUrl } from "@/lib/educators";

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
  return <div className="educator-detail-section"><h3>{title}</h3><p>{text}</p></div>;
}

function digitalLabel(fallback:string,url:string|null) {
  if (!url) return fallback;
  try {
    const host=new URL(url).hostname.toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "YouTube";
    if (host.includes("tiktok.com")) return "TikTok";
    if (host.includes("whatsapp.com") || host.includes("wa.me")) return "WhatsApp";
  } catch { return fallback; }
  return fallback;
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
  const lead = educatorLead(educator, 220);
  const linkCandidates:Array<[string,string|null]> = [
    ["אתר", educator.website_url], ["Instagram", educator.instagram_url],
    ["Facebook", educator.facebook_url], ["רשת חברתית נוספת", educator.other_social_url],
  ];
  const links = linkCandidates.map(([label,rawUrl]) => ({label:digitalLabel(label,rawUrl),url:safeWebUrl(rawUrl)}))
    .filter((entry)=>entry.url);
  const hasProfessional = [educator.training, educator.related_professions,
    educator.additional_professions, educator.volunteer_work].some(hasMeaningfulText);
  const hasStory = [educator.about,educator.teaching_approach].some(hasMeaningfulText);
  const hasPractical = [educator.reception_place, educator.reception_notes, educator.region_notes,
    educator.availability_notes, educator.online_notes].some(hasMeaningfulText) ||
    educator.online_status !== "no";

  return <main className="page educator-profile">
    <EducatorBackLink className="educator-back-top" />

    <section className={`educator-profile-hero${educator.status === "paused" ? " educator-paused" : ""}`}>
      <div className="educator-profile-media">
        {photo?.startsWith("/") ? (
          <Image src={photo} className="educator-profile-photo" alt="" width={760} height={620}
            sizes="(max-width: 700px) calc(100vw - 32px), 46vw" priority />
        ) : photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} className="educator-profile-photo" alt="" />
        ) : <PawnAvatar avatarKey={pawnAvatarForSeed(educator.id)} size={170} decorative />}
      </div>
      <div className="educator-profile-identity">
        <p className="educator-profile-kicker">מדריכת נשיאה</p>
        <h1>{educator.full_name}</h1>
        {educator.brand_name && <p className="educator-brand">{educator.brand_name}</p>}
        {educator.status === "paused" && <p className="educator-paused-label">לא מקבלת קהל כרגע</p>}
        {lead && <p className="educator-profile-intro">{lead}</p>}
        {compactAreas && <p className="educator-profile-areas">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
          <span>{compactAreas}</span>
        </p>}
      </div>
    </section>

    <section className="educator-contact-panel">
      <div><h2>רוצה לבדוק התאמה?</h2><p>אפשר לפנות ישירות ולברר לגבי הדרכה.</p></div>
      <EducatorContactActions educatorId={educator.id} educatorName={educator.full_name} email={email} compact />
    </section>

    {links.length > 0 && <section className="educator-profile-section educator-digital-links">
      <div className="educator-section-heading"><div><p>להכיר דרך התוכן</p><h2>ברשתות ובאתר</h2></div></div>
      <div className="educator-contact-links">{links.map(({label,url}) =>
        <a className="btn" href={url!} key={label} target="_blank" rel="noopener noreferrer">
          {label}<span aria-hidden="true"> ↗</span>
        </a>)}
      </div>
    </section>}

    {hasProfessional && <section className="educator-profile-section educator-professional-section">
      <div className="educator-section-heading">
        <svg className="educator-section-icon" aria-hidden="true" viewBox="0 0 24 24">
          <path d="M2.5 8 12 3l9.5 5L12 13 2.5 8Z"/><path d="M6 10.2v4.4c2.7 2 9.3 2 12 0v-4.4M21.5 8v6"/>
        </svg>
        <div><p>ידע וניסיון</p><h2>הרקע המקצועי שלי</h2></div>
      </div>
      <div className="educator-professional-details">
        <Detail title="הכשרה" text={educator.training} />
        <Detail title="מקצועות משיקים" text={educator.related_professions} />
        <Detail title="מקצועות נוספים" text={educator.additional_professions} />
        <Detail title="פעילות התנדבותית" text={educator.volunteer_work} />
      </div>
    </section>}

    {hasStory && <section className="educator-profile-section educator-story-section">
      <div className="educator-section-heading"><div><p>נעים להכיר</p><h2>קצת עליי</h2></div></div>
      {hasMeaningfulText(educator.about) && <div className="educator-story-block"><p>{educator.about}</p></div>}
      {hasMeaningfulText(educator.teaching_approach) && <div className="educator-story-block educator-approach-block">
        <h3>הגישה שלי בהדרכה ובנשיאה</h3><p>{educator.teaching_approach}</p>
      </div>}
    </section>}

    {hasPractical && <section className="educator-profile-section educator-practical">
      <div className="educator-section-heading"><div><p>לפני שפונות</p><h2>מידע שימושי</h2></div></div>
      <div className="educator-practical-grid">
        {fullAreas && <div><h3>אזורי שירות</h3><p>{fullAreas}</p></div>}
        {hasMeaningfulText(educator.reception_place) && <div><h3>איפה אפשר להגיע אליי?</h3><p>{educator.reception_place}</p></div>}
        {hasMeaningfulText(educator.reception_notes) && <div><h3>פרטים נוספים על מקום הקבלה</h3><p>{educator.reception_notes}</p></div>}
        {hasMeaningfulText(educator.region_notes) && <div><h3>פרטים נוספים על אזורי השירות</h3><p>{educator.region_notes}</p></div>}
        {educator.online_status === "yes" && <div><h3>פגישה אונליין</h3><p>מקבלת אונליין</p></div>}
        {educator.online_status === "special" && <div><h3>פגישה אונליין</h3><p>מקבלת אונליין במקרים מיוחדים</p></div>}
        {hasMeaningfulText(educator.online_notes) && <div><h3>עוד על פגישה אונליין</h3><p>{educator.online_notes}</p></div>}
        {hasMeaningfulText(educator.availability_notes) && <div><h3>זמינות</h3><p>{educator.availability_notes}</p></div>}
      </div>
    </section>}

    <section className="educator-bottom-contact">
      <h2>רוצה לדבר עם {educator.full_name}?</h2>
      <EducatorContactActions educatorId={educator.id} educatorName={educator.full_name} email={email} />
    </section>
    <EducatorBackLink className="educator-back-bottom" />
  </main>;
}
