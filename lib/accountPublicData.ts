import "server-only";

import { unstable_cache } from "next/cache";
import { createPublicServerClient } from "@/lib/supabase/public-server";

export const getAccountPublicData = unstable_cache(
  async () => {
    const supabase = createPublicServerClient();
    const [settingsResult, regionsResult, subregionsResult] = await Promise.all([
      supabase
        .from("site_settings")
        .select("allow_incomplete_listings")
        .eq("singleton", true)
        .maybeSingle(),
      supabase
        .from("regions")
        .select("*")
        .eq("active", true)
        .order("sort_order"),
      supabase
        .from("subregions")
        .select("*")
        .eq("active", true)
        .order("sort_order"),
    ]);

    const error = [settingsResult, regionsResult, subregionsResult].find(
      (result) => result.error
    )?.error;
    if (error) throw error;

    return {
      settings: settingsResult.data,
      regions: regionsResult.data || [],
      subregions: subregionsResult.data || [],
    };
  },
  ["account-public-data-v1"],
  { revalidate: 300 }
);
