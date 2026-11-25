"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

type Region = { id: string; name: string; sort_order: number };
type Subregion = { id: string; name: string; region_id: string; sort_order: number };

const EMPTY_PROFILE = {
  full_name: "", brand_name: "", card_intro: "", photo_url: "", training: "",
  related_professions: "", additional_professions: "", volunteer_work: "",
  teaching_approach: "", about: "", reception_place: "", reception_notes: "",
  region_notes: "", availability_notes: "", online_status: "no", online_notes: "",
  phone: "", contact_email: "", website_url: "", instagram_url: "",
  facebook_url: "", other_social_url: "", status: "active",
};

function reviewLabel(status?: string) {
  if (status === "submitted") return "ממתין לבדיקה";
  if (status === "changes_requested") return "חזר לתיקון";
  if (status === "approved") return "מאושר";
  if (status === "rejected") return "לא אושר";
  return "טיוטה";
}

function Field({ label, name, value, onChange, textarea=false, hint }: {
  label:string; name:string; value:string; onChange:(name:string,value:string)=>void;
  textarea?:boolean; hint?:string;
}) {
  return <label className="educator-editor-field">
    <span>{label}</span>{hint && <small>{hint}</small>}
    {textarea ? <textarea name={name} value={value} rows={3}
      onChange={(e)=>onChange(name,e.target.value)} /> :
      <input name={name} value={value} onChange={(e)=>onChange(name,e.target.value)} />}
  </label>;
}

function AreaPicker({ regions, subregions, regionIds, subregionIds, onChange }: {
  regions:Region[]; subregions:Subregion[]; regionIds:string[]; subregionIds:string[];
  onChange:(regions:string[],subregions:string[])=>void;
}) {
  const regionSet=new Set(regionIds); const subregionSet=new Set(subregionIds);
  const toggleRegion=(region:Region,checked:boolean)=>{
    const nextRegions=checked ? [...regionSet,region.id] : [...regionSet].filter((id)=>id!==region.id);
    const childIds=new Set(subregions.filter((s)=>s.region_id===region.id).map((s)=>s.id));
    const nextSubs=checked ? [...subregionSet].filter((id)=>!childIds.has(id)) : [...subregionSet];
    onChange([...new Set(nextRegions)],nextSubs);
  };
  const toggleSubregion=(subregion:Subregion,checked:boolean)=>{
    const next=checked ? [...subregionSet,subregion.id] : [...subregionSet].filter((id)=>id!==subregion.id);
    onChange(regionIds,[...new Set(next)]);
  };
  return <fieldset className="educator-area-editor">
    <legend>אזורים שבהם אפשר לקבל ממך שירות</legend>
    <p className="muted">אפשר לבחור אזור שלם או לפתוח אותו ולסמן תתי־אזורים.</p>
    {regions.map((region)=>{
      const children=subregions.filter((s)=>s.region_id===region.id);
      return <details key={region.id} className="educator-area-edit-region">
        <summary>
          <label onClick={(e)=>e.stopPropagation()}>
            <input type="checkbox" checked={regionSet.has(region.id)}
              onChange={(e)=>toggleRegion(region,e.target.checked)} />
            כל אזור {region.name}
          </label>
          <span aria-hidden="true">⌄</span>
        </summary>
        {!regionSet.has(region.id) && <div className="educator-area-edit-subs">
          {children.map((sub)=><label key={sub.id}>
            <input type="checkbox" checked={subregionSet.has(sub.id)}
              onChange={(e)=>toggleSubregion(sub,e.target.checked)} /> {sub.name}
          </label>)}
        </div>}
      </details>;
    })}
  </fieldset>;
}

function OptionalFields({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  return collapsed ? <details className="dashboard-panel">
    <summary>הוספת פרטים (לא חובה)</summary>
    <div className="dashboard-panel-body educator-editor">{children}</div>
  </details> : <>{children}</>;
}

export function EducatorProfileEditor({ initialProfile, regions, subregions, mode="own",
  educatorId=null, onSaved }: {
  initialProfile?:any; regions:Region[]; subregions:Subregion[];
  mode?:"own"|"manager"; educatorId?:string|null; onSaved?:()=>void;
}) {
  const s=useMemo(()=>createClient(),[]);
  const [profile,setProfile]=useState({...EMPTY_PROFILE,...(initialProfile || {})});
  const [regionIds,setRegionIds]=useState<string[]>(initialProfile?.region_ids || []);
  const [subregionIds,setSubregionIds]=useState<string[]>(initialProfile?.subregion_ids || []);
  const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
  const approved=initialProfile?.review_status==="approved";
  const isNewApplication=mode==="own" && !initialProfile;
  const change=(name:string,value:string)=>setProfile((current:any)=>({...current,[name]:value}));

  async function save(submit=false) {
    if (busy) return;
    if (!profile.full_name?.trim()) { setMessage("צריך למלא שם"); return; }
    setBusy(true); setMessage("");
    const rpc=mode==="manager" ? "admin_save_educator_profile" : "save_my_educator_profile";
    const payload=Object.fromEntries(Object.keys(EMPTY_PROFILE).map((key)=>[key,profile[key]]));
    const fields={p_profile:payload,p_region_ids:regionIds,p_subregion_ids:subregionIds};
    const params=mode==="manager" ? {p_educator_id:educatorId,...fields} : fields;
    const {error}=await s.rpc(rpc,params);
    if (error) { setMessage(error.message); setBusy(false); return; }
    if (submit && mode==="own") {
      const {error:submitError}=await s.rpc("submit_my_educator_profile");
      if (submitError) { setMessage(submitError.message); setBusy(false); return; }
    }
    setMessage(submit ? "הפרטים נשלחו לבדיקה" : "השינויים נשמרו");
    setBusy(false);
    if (!submit && !isNewApplication) onSaved?.();
    if (mode==="manager") window.setTimeout(()=>location.reload(),500);
    if (submit || isNewApplication) location.href="/admin?tab=my-card";
  }

  return <form className="educator-editor" onSubmit={(e)=>{e.preventDefault();void save(false);}}>
    {isNewApplication && <section className="educator-editor-section">
      <Field label="שם מלא" name="full_name" value={profile.full_name || ""} onChange={change} />
    </section>}
    <OptionalFields collapsed={isNewApplication}>
    <section className="educator-editor-section">
      <h3>הפרטים שמופיעים בכרטיס</h3>
      {!isNewApplication && <Field label="שם מלא" name="full_name" value={profile.full_name || ""} onChange={change} />}
      <Field label="שם המותג, אם יש" name="brand_name" value={profile.brand_name || ""} onChange={change} />
      <Field label="משפט היכרות קצר (לא חובה)" name="card_intro" value={profile.card_intro || ""}
        onChange={change} textarea hint="אם תרצי, כתבי משפט שיופיע ברשימת המדריכות." />
      {mode==="manager" && <Field label="נתיב תמונה" name="photo_url" value={profile.photo_url || ""} onChange={change}
        hint="שדה טכני למנהלת; העלאת תמונות עצמאית תתווסף בהמשך." />}
      <Field label="הכשרה" name="training" value={profile.training || ""} onChange={change} textarea />
    </section>

    <AreaPicker regions={regions} subregions={subregions} regionIds={regionIds}
      subregionIds={subregionIds} onChange={(r,sb)=>{setRegionIds(r);setSubregionIds(sb);}} />

    <section className="educator-editor-section">
      <h3>היכרות מקצועית</h3>
      <Field label="מקצועות משיקים" name="related_professions" value={profile.related_professions || ""} onChange={change} textarea />
      <Field label="מקצועות נוספים" name="additional_professions" value={profile.additional_professions || ""} onChange={change} textarea />
      <Field label="פעילות התנדבותית" name="volunteer_work" value={profile.volunteer_work || ""} onChange={change} textarea />
      <Field label="גישה להדרכה" name="teaching_approach" value={profile.teaching_approach || ""} onChange={change} textarea />
      <Field label="עליי" name="about" value={profile.about || ""} onChange={change} textarea />
    </section>

    <section className="educator-editor-section">
      <h3>קבלה וזמינות</h3>
      <label className="educator-editor-field"><span>הדרכות אונליין</span>
        <select value={profile.online_status || "no"} onChange={(e)=>change("online_status",e.target.value)}>
          <option value="yes">כן</option><option value="special">במקרים מיוחדים</option><option value="no">לא</option>
        </select>
      </label>
      <Field label="איפה אני מקבלת" name="reception_place" value={profile.reception_place || ""} onChange={change} textarea />
      <Field label="הערות על מקום הקבלה" name="reception_notes" value={profile.reception_notes || ""} onChange={change} textarea />
      <Field label="הערות על אזורי השירות" name="region_notes" value={profile.region_notes || ""} onChange={change} textarea />
      <Field label="הערות זמינות" name="availability_notes" value={profile.availability_notes || ""} onChange={change} textarea />
      <Field label="הערות על אונליין" name="online_notes" value={profile.online_notes || ""} onChange={change} textarea />
      {(approved || mode==="manager") && <label className="educator-editor-field"><span>מצב הכרטיס</span>
        <select value={profile.status || "active"} onChange={(e)=>change("status",e.target.value)}>
          <option value="active">מקבלת קהל</option><option value="paused">לא מקבלת קהל כרגע</option>
          {mode==="manager" && <option value="hidden">מוסתר</option>}
          {mode==="own" && initialProfile?.status==="hidden" && <option value="hidden">מוסתר על ידי הניהול</option>}
        </select>
      </label>}
    </section>

    <section className="educator-editor-section">
      <h3>יצירת קשר ונכסים דיגיטליים</h3>
      <Field label="טלפון" name="phone" value={profile.phone || ""} onChange={change} />
      <Field label="דוא״ל" name="contact_email" value={profile.contact_email || ""} onChange={change} />
      <Field label="אתר" name="website_url" value={profile.website_url || ""} onChange={change} />
      <Field label="Instagram" name="instagram_url" value={profile.instagram_url || ""} onChange={change} />
      <Field label="Facebook" name="facebook_url" value={profile.facebook_url || ""} onChange={change} />
      <Field label="קישור נוסף" name="other_social_url" value={profile.other_social_url || ""} onChange={change} />
    </section>
    </OptionalFields>

    {message && <p className="educator-editor-message" role="status">{message}</p>}
    <div className="educator-editor-actions">
      <button className={isNewApplication ? "btn" : "btn primary"} type="submit" disabled={busy}>
        {busy ? "שומרת…" : approved || mode==="manager" ? "שמירת שינויים" : "שמירת טיוטה"}
      </button>
      {!approved && mode==="own" && <button className={isNewApplication ? "btn primary" : "btn"} type="button" disabled={busy}
        onClick={()=>void save(true)}>שמירה ושליחה לבדיקה</button>}
    </div>
  </form>;
}

export function EducatorClaimBox() {
  const s=useMemo(()=>createClient(),[]); const [code,setCode]=useState("");
  const [preview,setPreview]=useState<any>(null); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
  async function check() {
    const normalized=code.replace(/\D/g,"").slice(0,4); setCode(normalized); setPreview(null); setMessage("");
    if (normalized.length!==4) {setMessage("הקוד צריך לכלול ארבע ספרות");return;}
    setBusy(true); const {data,error}=await s.rpc("preview_educator_claim",{p_code:normalized}); setBusy(false);
    if (error || !data) {setMessage("הקוד לא נמצא, פג או שנעשו יותר מדי ניסיונות. אפשר לבדוק את הקוד או לנסות שוב בעוד רבע שעה.");return;} setPreview(data);
  }
  async function claim() {
    if (!preview || busy) return;
    setBusy(true); const {data,error}=await s.rpc("claim_educator_profile",{p_code:code,p_educator_id:preview.id});
    if (error || !data) {setMessage("לא ניתן לחבר את הכרטיס עם הקוד הזה כרגע.");setPreview(null);setBusy(false);return;} location.href="/admin?tab=my-card";
  }
  return <div className="educator-claim-box">
    <h2>כבר יש לך כרטיס במאגר?</h2>
    <p>הזיני את הקוד בן ארבע הספרות שקיבלת.</p>
    <div className="educator-claim-input"><input inputMode="numeric" pattern="[0-9]*" maxLength={4}
      value={code} disabled={busy} onChange={(e)=>{setCode(e.target.value.replace(/\D/g,"").slice(0,4));setPreview(null);setMessage("");}}
      aria-label="קוד תביעה בן ארבע ספרות" /><button className="btn" type="button" disabled={busy} onClick={()=>void check()}>בדיקת הקוד</button></div>
    {message && <p className="educator-editor-message" role="status">{message}</p>}
    {preview && <div className="educator-claim-preview">
      <strong>{preview.full_name}</strong>{preview.brand_name && <span>{preview.brand_name}</span>}
      <p>זה הכרטיס שלך?</p><button className="btn primary" type="button" disabled={busy} onClick={()=>void claim()}>כן, חיבור הכרטיס לחשבון שלי</button>
    </div>}
  </div>;
}

function profileSuggestions(profile:any) {
  if (!profile) return [];
  const missing:string[]=[];
  if (!String(profile.card_intro || "").trim()) missing.push("משפט היכרות קצר");
  if (!profile.region_ids?.length && !profile.subregion_ids?.length &&
    profile.online_status!=="yes" && profile.online_status!=="special") {
    missing.push("אזורי פעילות או סימון הדרכות אונליין");
  }
  return missing;
}

export default function EducatorWorkspace({ profile:initialProfile, managerProfiles:initialManagerProfiles,
  view, regions, subregions }: {
  profile:any|null; managerProfiles:any[]; view:"own"|"manager"; regions:Region[]; subregions:Subregion[];
}) {
  const s=useMemo(()=>createClient(),[]); const [profiles,setProfiles]=useState(initialManagerProfiles || []);
  const router=useRouter();
  const [editing,setEditing]=useState<string|null>(null); const [adding,setAdding]=useState(false);
  const [query,setQuery]=useState(""); const [message,setMessage]=useState("");
  const filtered=profiles.filter((p)=>JSON.stringify([p.full_name,p.brand_name,p.owner_email]).toLowerCase().includes(query.toLowerCase()));
  const suggestions=profileSuggestions(initialProfile);

  async function action(id:string,actionName:string,note?:string) {
    const {error}=await s.rpc("admin_review_educator",{p_educator_id:id,p_action:actionName,p_note:note || null});
    if (error) {setMessage(error.message);return;} location.reload();
  }
  async function regenerate(id:string) {
    const {data,error}=await s.rpc("admin_regenerate_educator_claim_code",{p_educator_id:id});
    if (error) {setMessage(error.message);return;}
    setProfiles((rows)=>rows.map((p)=>p.id===id ? {...p,claim_code:data}:p)); setMessage("נוצר קוד חדש");
  }
  async function linkByEmail(id:string) {
    const email=prompt("כתובת המייל של המשתמשת שכבר נרשמה לאתר")?.trim();
    if (!email) return;
    const {error}=await s.rpc("admin_link_educator_to_email",{p_educator_id:id,p_email:email});
    if (error) {setMessage(error.message);return;} location.reload();
  }

  return <div className="educator-workspace">
    {view==="own" && (initialProfile ? <section className="dashboard-panel">
      <div className="dashboard-panel-body">
        <p className="muted">מצב הכרטיס: {reviewLabel(initialProfile.review_status)}</p>
        {initialProfile.review_note && <div className="educator-review-note"><strong>הערה מהמנהלת</strong><p>{initialProfile.review_note}</p></div>}
        {suggestions.length>0 && <aside className="educator-onboarding-note" aria-label="אפשר להשלים בהמשך">
          <p><strong>אפשר להשלים בהמשך:</strong> {suggestions.join(" · ")}</p>
        </aside>}
        <EducatorProfileEditor initialProfile={initialProfile} regions={regions} subregions={subregions}
          onSaved={()=>router.refresh()} />
        {initialProfile.published && <p><Link className="btn" href={`/educators/${initialProfile.id}`}>צפייה בכרטיס הציבורי</Link></p>}
      </div>
    </section> : <section className="dashboard-panel dashboard-panel-empty">
      <h2>כרטיס המדריכה שלי</h2><p>אפשר לחבר כרטיס קיים או להגיש כרטיס חדש.</p>
      <Link className="btn primary" href="/educators/join">חיבור כרטיס קיים או בקשת הצטרפות</Link>
    </section>)}

    {view==="manager" && <section className="dashboard-panel" aria-label="ניהול מדריכות">
      <div className="dashboard-panel-body">
        <div className="educator-manager-toolbar">
          <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="חיפוש מדריכה" aria-label="חיפוש מדריכה" />
          <button className="btn primary" type="button" onClick={()=>setAdding((v)=>!v)}>＋ הוספת מדריכה</button>
        </div>
        {message && <p className="educator-editor-message" role="status">{message}</p>}
        {adding && <div className="educator-manager-editor"><EducatorProfileEditor mode="manager"
          regions={regions} subregions={subregions} /></div>}
        <div className="educator-manager-list">{filtered.map((p)=><article key={p.id} className="educator-manager-row">
          <div className="educator-manager-heading"><div><strong>{p.full_name}</strong>{p.brand_name && <span>{p.brand_name}</span>}</div>
            <span className={`educator-review-status status-${p.review_status}`}>{reviewLabel(p.review_status)}</span></div>
          <p className="muted">{p.owner_email ? `מחובר ל־${p.owner_email}` : "עדיין לא נתבע"} · {p.status}</p>
          {p.review_note && <p className="educator-review-inline">הערה: {p.review_note}</p>}
          {!p.owner_id && <div className="educator-claim-code"><span>קוד תביעה: <b>{p.claim_code || "אין קוד בתוקף"}</b></span>
            <div className="educator-manager-actions">{p.published && p.status!=="hidden" && <button type="button" className="btn" onClick={()=>void regenerate(p.id)}>{p.claim_code ? "החלפת קוד" : "יצירת קוד לשבעה ימים"}</button>}
              <button type="button" className="btn" onClick={()=>void linkByEmail(p.id)}>חיבור למשתמשת לפי מייל</button></div></div>}
          <div className="educator-manager-actions">
            <button className="btn" type="button" onClick={()=>setEditing(editing===p.id ? null : p.id)}>עריכה</button>
            {p.review_status==="submitted" && <>
              <button className="btn primary" type="button" onClick={()=>void action(p.id,"approve")}>אישור</button>
              <button className="btn" type="button" onClick={()=>{const n=prompt("מה צריך לתקן?");if(n)void action(p.id,"changes",n);}}>החזרה לתיקון</button>
              <button className="btn danger" type="button" onClick={()=>{if(confirm("לדחות את הבקשה?")){const n=prompt("הערה למגישה") || "";void action(p.id,"reject",n);}}}>דחייה</button>
            </>}
            {p.status==="active" && <button className="btn" type="button" onClick={()=>void action(p.id,"pause")}>סימון כלא מקבלת</button>}
            {p.status==="paused" && <button className="btn" type="button" onClick={()=>void action(p.id,"activate")}>החזרה לפעילות</button>}
          </div>
          {editing===p.id && <div className="educator-manager-editor"><EducatorProfileEditor mode="manager"
            educatorId={p.id} initialProfile={p} regions={regions} subregions={subregions} /></div>}
        </article>)}</div>
      </div>
    </section>}
  </div>;
}
