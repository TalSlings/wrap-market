import "server-only";

import { unstable_cache } from "next/cache";
import { createPublicServerClient } from "@/lib/supabase/public-server";

async function readHomePublicData() {
  const supabase = createPublicServerClient();

  const [
    settingsResult,
    manufacturersResult,
    materialsResult,
    colorsResult,
    regionsResult,
    subregionsResult,
    helpNotesResult,
  ] = await Promise.all([
    supabase
      .from("site_settings")
      .select("allow_incomplete_listings")
      .eq("singleton", true)
      .maybeSingle(),
    supabase
      .from("manufacturers")
      .select("id,name")
      .eq("status", "active")
      .order("name"),
    supabase
      .from("materials")
      .select(
        "id,name,parent_material_id,vegan,easycare,material_origin,is_selectable,status"
      )
      .eq("status", "active")
      .order("name"),
    supabase.from("colors").select("*").eq("active", true).order("sort_order"),
    supabase.from("regions").select("*").eq("active", true).order("sort_order"),
    supabase
      .from("subregions")
      .select("*")
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("help_notes")
      .select("section_key,placement,content,is_visible")
      .eq("placement", "search"),
  ]);

  const error = [
    settingsResult,
    manufacturersResult,
    materialsResult,
    colorsResult,
    regionsResult,
    subregionsResult,
    helpNotesResult,
  ].find((result) => result.error)?.error;

  if (error) throw error;

  return {
    settings: settingsResult.data,
    manufacturers: manufacturersResult.data || [],
    materials: materialsResult.data || [],
    colors: colorsResult.data || [],
    regions: regionsResult.data || [],
    subregions: subregionsResult.data || [],
    helpNotes: helpNotesResult.data || [],
  };
}

export const getHomePublicData = unstable_cache(
  readHomePublicData,
  ["home-public-data-v1"],
  { revalidate: 300 }
);

export const getHomeListingCandidates = unstable_cache(
  async (allowIncomplete: boolean) => {
    const supabase = createPublicServerClient();
    const statuses = allowIncomplete ? ["active", "incomplete"] : ["active"];
    const { data, error } = await supabase
      .from("listings")
      .select("id,status")
      .in("status", statuses);

    if (error) throw error;
    return data || [];
  },
  ["home-listing-candidates-v1"],
  { revalidate: 20 }
);
