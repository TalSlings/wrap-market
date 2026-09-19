import "server-only";
import { createClient } from "@/lib/supabase/server";

export type OnlineStatus = "yes" | "special" | "no";
export type Educator = {
  id: string; full_name: string; brand_name: string | null; card_intro: string | null;
  photo_url: string | null; training: string | null; additional_professions: string | null;
  related_professions: string | null; volunteer_work: string | null;
  teaching_approach: string | null; about: string | null; reception_place: string | null;
  reception_notes: string | null; region_notes: string | null; availability_notes: string | null;
  online_available: boolean; online_status: OnlineStatus; online_notes: string | null;
  phone?: string | null;
  contact_email: string | null; website_url: string | null; instagram_url: string | null;
  facebook_url: string | null; other_social_url: string | null;
  status: "active" | "paused"; region_ids: string[]; subregion_ids: string[];
};
export type Region = { id: string; name: string; sort_order: number };
export type Subregion = { id: string; name: string; region_id: string; sort_order: number };
type ResultGroup = "direct" | "nearby" | "fallback" | "all";

const SUBREGION_LINKS: Array<[string, string, boolean?]> = [
  ["1ג","2ב"],["1ד","2ב"],["1ו","2ו"],["1ו","2ז"],["1ז","2ו"],["1ז","2ז"],
  ["3א","2ג"],["3א","2ד"],["3א","2ה"],["3א","2ז"],["3ב","2ג"],["3ב","2ד"],["3ב","2ה"],["3ב","2ז"],
  ["3ו","7א"],["3ו","7ב"],["3ג","4א"],["3ג","4ב"],["3ד","4א"],["3ד","4ב"],["3ו","4א"],["3ו","4ב"],
  ["3ה","4א"],["3ה","4ג"],["3ה","4ד"],["3ו","5ה"],["3ו","5ו"],["4ב","5ה"],["4ב","5ו"],
  ["4ה","5א"],["4ו","5א"],["4ז","5א"],["4ז","5ב"],["6ה","5ה"],["6ה","5ו"],
  ["6ו","5א"],["6ו","5ד"],["6ו","5ה"],["7א","6ג"],["7א","6ד"],["7א","6ה"],["7ב","6ג"],["7ב","6ד"],["7ב","6ה"],
  ["7ד","6ד"],["7ג","5ד"],["7ג","6ו"],["7ג","8א"],["7ג","8ג"],["7ג","8ד"],["7ד","8ג"],["7ד","8ד"],
  ["8א","5ג"],["8א","5ד"],["8ב","5ג"],["8ב","5ד"],["7ד","6א",true],["7ד","6ב",true],
];
const STRONG_REGION_LINKS: Record<number, number[]> = {
  1:[2],2:[1,3],3:[2,4],4:[3,5],5:[4,8],6:[5],7:[],8:[5,7],
};
const WEAK_REGION_LINKS: Record<number, number[]> = {
  1:[],2:[],3:[7],4:[],5:[],6:[7,8],7:[3,4,6,8],8:[],
};

export async function getDirectoryData() {
  const s = await createClient();
  const [educatorsResult, regionsResult, subregionsResult] = await Promise.all([
    s.rpc("get_public_educators"),
    s.from("regions").select("id,name,sort_order").eq("active",true).order("sort_order"),
    s.from("subregions").select("id,name,region_id,sort_order").eq("active",true).order("sort_order"),
  ]);
  if (educatorsResult.error || regionsResult.error || subregionsResult.error)
    throw new Error("Educators directory database setup is unavailable");
  const educators = ((educatorsResult.data || []) as Array<Partial<Educator> & Pick<Educator,"id"|"full_name">>)
    .map((e) => ({...e, brand_name:e.brand_name || null, card_intro:e.card_intro || null,
      online_available:Boolean(e.online_available),
      online_status:e.online_status || (e.online_available ? "yes" : "no"),
      region_ids:e.region_ids || [], subregion_ids:e.subregion_ids || []})) as Educator[];
  return { educators, regions:(regionsResult.data || []) as Region[],
    subregions:(subregionsResult.data || []) as Subregion[] };
}

function stableScore(id:string) {
  let hash=2166136261;
  for (const char of id) { hash ^= char.charCodeAt(0); hash=Math.imul(hash,16777619); }
  return hash>>>0;
}
function hebrewLetter(index:number) { return String.fromCharCode("א".charCodeAt(0)+index-1); }
function subregionCode(s:Subregion,r:Region) { return `${r.sort_order}${hebrewLetter(s.sort_order)}`; }
function matchesRegion(e:Educator,regionId:string,subregionIds:Set<string>) {
  return e.region_ids.includes(regionId) || e.subregion_ids.some((id)=>subregionIds.has(id));
}

export function orderEducators(educators:Educator[], selectedSubregion:Subregion|null,
  selectedRegionId:string|null): Array<{educator:Educator;group:ResultGroup}>;
export function orderEducators(educators:Educator[], regions:Region[], subregions:Subregion[],
  selectedSubregion:Subregion|null, selectedRegionId:string|null, onlineOnly:boolean):
  Array<{educator:Educator;group:ResultGroup}>;
export function orderEducators(
  educators:Educator[], regionsOrSelected:Region[]|Subregion|null,
  subregionsOrRegion:Subregion[]|string|null, selectedArg:Subregion|null=null,
  regionArg:string|null=null, onlineArg=false,
) {
  if (!Array.isArray(regionsOrSelected) || !Array.isArray(subregionsOrRegion)) {
    const oldSelected=regionsOrSelected as Subregion|null;
    const oldRegion=subregionsOrRegion as string|null;
    return sortResults(educators.filter((e)=>!oldRegion || e.region_ids.includes(oldRegion) ||
      Boolean(oldSelected && e.subregion_ids.includes(oldSelected.id))).map((educator)=>({
      educator, group:oldSelected && educator.subregion_ids.includes(oldSelected.id) ? "direct" as const : "nearby" as const,
    })));
  }
  const regions=regionsOrSelected;
  const subregions=subregionsOrRegion;
  const selectedSubregion=selectedArg;
  const selectedRegionId=regionArg;
  const onlineOnly=onlineArg;
  const filtered=educators.filter((e)=>!onlineOnly || e.online_status!=="no");
  const selectedRegion=regions.find((r)=>r.id===(selectedSubregion?.region_id || selectedRegionId));
  if (!selectedRegion) return sortResults(filtered.map((educator)=>({educator,group:"all" as const})));
  const regionSubregions=new Set(subregions.filter((s)=>s.region_id===selectedRegion.id).map((s)=>s.id));
  const direct:Educator[]=[]; const nearby:Educator[]=[]; const used=new Set<string>();
  if (selectedSubregion) {
    const codeToSubregion=new Map<string,Subregion>();
    for (const subregion of subregions) {
      const region=regions.find((r)=>r.id===subregion.region_id);
      if (region) codeToSubregion.set(subregionCode(subregion,region),subregion);
    }
    const selectedCode=subregionCode(selectedSubregion,selectedRegion);
    const closeIds=new Set<string>();
    for (const [from,to,oneWay] of SUBREGION_LINKS) {
      if (from===selectedCode) closeIds.add(codeToSubregion.get(to)?.id || "");
      if (!oneWay && to===selectedCode) closeIds.add(codeToSubregion.get(from)?.id || "");
    }
    closeIds.delete("");
    for (const educator of filtered) {
      if (educator.subregion_ids.includes(selectedSubregion.id)) { direct.push(educator); used.add(educator.id); }
      else if (educator.region_ids.includes(selectedRegion.id) || educator.subregion_ids.some((id)=>closeIds.has(id))) {
        nearby.push(educator); used.add(educator.id);
      }
    }
  } else {
    for (const educator of filtered) if (matchesRegion(educator,selectedRegion.id,regionSubregions)) {
      direct.push(educator); used.add(educator.id);
    }
  }
  const activeLocalCount=[...direct,...nearby].filter((e)=>e.status==="active").length;
  const fallback:Educator[]=[];
  if (activeLocalCount<2) {
    const addFallback=(sortOrders:number[])=>{
      const ids=new Set(regions.filter((r)=>sortOrders.includes(r.sort_order)).map((r)=>r.id));
      const subIds=new Set(subregions.filter((s)=>ids.has(s.region_id)).map((s)=>s.id));
      for (const educator of filtered) if (!used.has(educator.id) &&
        (educator.region_ids.some((id)=>ids.has(id)) || educator.subregion_ids.some((id)=>subIds.has(id)))) {
        fallback.push(educator); used.add(educator.id);
      }
    };
    addFallback(STRONG_REGION_LINKS[selectedRegion.sort_order] || []);
    if (activeLocalCount+fallback.filter((e)=>e.status==="active").length<2)
      addFallback(WEAK_REGION_LINKS[selectedRegion.sort_order] || []);
  }
  return sortResults([
    ...direct.map((educator)=>({educator,group:"direct" as const})),
    ...nearby.map((educator)=>({educator,group:"nearby" as const})),
    ...fallback.map((educator)=>({educator,group:"fallback" as const})),
  ]);
}

function sortResults<T extends {educator:Educator;group:ResultGroup}>(rows:T[]) {
  const groups:Record<ResultGroup,number>={direct:0,nearby:1,fallback:2,all:0};
  return rows.sort((a,b)=>groups[a.group]-groups[b.group] ||
    Number(a.educator.status==="paused")-Number(b.educator.status==="paused") ||
    Number(b.educator.online_status==="yes")-Number(a.educator.online_status==="yes") ||
    stableScore(a.educator.id)-stableScore(b.educator.id) || a.educator.id.localeCompare(b.educator.id));
}

export function formatServiceAreas(e:Educator,regions:Region[],subregions:Subregion[],compact=false) {
  const fullRegionIds=new Set(e.region_ids);
  const names=[...regions.filter((r)=>fullRegionIds.has(r.id)).map((r)=>r.name),
    ...subregions.filter((s)=>e.subregion_ids.includes(s.id) && !fullRegionIds.has(s.region_id)).map((s)=>s.name)];
  if (!compact || names.length<=3) return names.join(" · ");
  return `${names.slice(0,3).join(" · ")} · ועוד ${names.length-3}`;
}
export function safeWebUrl(value:string|null) {
  if (!value) return null;
  try { const url=new URL(value); return url.protocol==="https:" || url.protocol==="http:" ? url.toString() : null; }
  catch { return null; }
}
export function emailLink(value:string|null) {
  const email=value?.trim() || "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : null;
}
export function phoneLink(value:string|null|undefined) {
  const digits=value?.replace(/[^0-9+]/g,"") || "";
  return digits.length>=9 ? `tel:${digits}` : null;
}
export function educatorsPreviewEnabled() {
  return process.env.EDUCATORS_DIRECTORY_PREVIEW_ENABLED==="true";
}
