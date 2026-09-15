import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Educator = {
  id: string;
  full_name: string;
  photo_url: string | null;
  training: string | null;
  additional_professions: string | null;
  related_professions: string | null;
  volunteer_work: string | null;
  teaching_approach: string | null;
  about: string | null;
  reception_place: string | null;
  reception_notes: string | null;
  region_notes: string | null;
  availability_notes: string | null;
  online_available: boolean;
  online_notes: string | null;
  phone: string | null;
  contact_email: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  other_social_url: string | null;
  status: "active" | "paused";
  region_ids: string[];
  subregion_ids: string[];
};

export type Region = { id: string; name: string; sort_order: number };
export type Subregion = {
  id: string;
  name: string;
  region_id: string;
  sort_order: number;
};

export function educatorsPreviewEnabled() {
  return process.env.EDUCATORS_DIRECTORY_PREVIEW_ENABLED === "true";
}

export async function getDirectoryData() {
  const s = await createClient();
  const [educatorsResult, regionsResult, subregionsResult] = await Promise.all([
    s.rpc("get_public_educators"),
    s.from("regions").select("id,name,sort_order").eq("active", true)
      .order("sort_order"),
    s.from("subregions").select("id,name,region_id,sort_order")
      .eq("active", true).order("sort_order"),
  ]);

  if (educatorsResult.error || regionsResult.error || subregionsResult.error) {
    throw new Error("Educators directory database setup is unavailable");
  }

  return {
    educators: (educatorsResult.data || []) as Educator[],
    regions: (regionsResult.data || []) as Region[],
    subregions: (subregionsResult.data || []) as Subregion[],
  };
}

function stableScore(id: string) {
  let hash = 2166136261;
  for (const char of id) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function orderEducators(
  educators: Educator[],
  selectedSubregion: Subregion | null,
  selectedRegionId: string | null,
) {
  const regionId = selectedSubregion?.region_id || selectedRegionId;
  return educators
    .filter((e) => !regionId || e.region_ids.includes(regionId) ||
      e.subregion_ids.some((id) => id === selectedSubregion?.id))
    .map((educator) => {
      const direct = Boolean(selectedSubregion &&
        educator.subregion_ids.includes(selectedSubregion.id));
      return {
        educator,
        group: selectedSubregion ? (direct ? "direct" as const : "nearby" as const)
          : "all" as const,
      };
    })
    .sort((a, b) => {
      const aGroup = a.group === "direct" ? 0 : 1;
      const bGroup = b.group === "direct" ? 0 : 1;
      if (aGroup !== bGroup) return aGroup - bGroup;
      const aPaused = a.educator.status === "paused" ? 1 : 0;
      const bPaused = b.educator.status === "paused" ? 1 : 0;
      return aPaused - bPaused ||
        stableScore(a.educator.id) - stableScore(b.educator.id) ||
        a.educator.id.localeCompare(b.educator.id);
    });
}

export function safeWebUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString() : null;
  } catch {
    return null;
  }
}

export function phoneLink(value: string | null) {
  const digits = value?.replace(/[^0-9+]/g, "") || "";
  return digits.length >= 9 ? `tel:${digits}` : null;
}

export function emailLink(value: string | null) {
  const email = value?.trim() || "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? `mailto:${email}` : null;
}
