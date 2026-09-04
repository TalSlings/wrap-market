import { createClient } from "@/lib/supabase/server";
import HomeClient from "@/components/HomeClient";
import type { Metadata } from "next";
import { fetchHomeListings } from "@/lib/homeListings";
import { sortListingsByDailyDefault } from "@/lib/listingSort";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const query = await searchParams;
  const isSearchOrSharedView = Object.keys(query).length > 0;

  return {
    alternates: { canonical: "/" },
    robots: isSearchOrSharedView
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ shared?: string }>;
}) {
  const sp = await searchParams;
  let initial: any = {};

  if (sp.shared) {
    try {
      initial = JSON.parse(
        decodeURIComponent(
          escape(
            atob(
              decodeURIComponent(sp.shared)
            )
          )
        )
      );
    } catch {}
  }

  const s = await createClient();

  const {
    data: { user },
  } = await s.auth.getUser();

  const { data: settings } = await s
    .from("site_settings")
    .select("allow_incomplete_listings")
    .eq("singleton", true)
    .maybeSingle();

  const publicStatuses = settings?.allow_incomplete_listings
    ? ["active", "incomplete"]
    : ["active"];

  const loadAllListingsInitially = Boolean(sp.shared);

  const [
    listingSource,
    { data: manufacturers },
    { data: materials },
    { data: colors },
    { data: regions },
    { data: subregions },
    { data: helpNotes },
  ] = await Promise.all([
    loadAllListingsInitially
      ? fetchHomeListings(s, publicStatuses)
      : s
          .from("listings")
          .select("id,status")
          .in("status", publicStatuses),

    s
      .from("manufacturers")
      .select("id,name")
      .eq("status", "active")
      .order("name"),

    s
      .from("materials")
      .select(
        "id,name,parent_material_id,vegan,easycare,material_origin,is_selectable,status"
      )
      .eq("status", "active")
      .order("name"),

    s
      .from("colors")
      .select("*")
      .eq("active", true)
      .order("sort_order"),

    s
      .from("regions")
      .select("*")
      .eq("active", true)
      .order("sort_order"),

    s
      .from("subregions")
      .select("*")
      .eq("active", true)
      .order("sort_order"),

    s
      .from("help_notes")
      .select("section_key,placement,content,is_visible")
      .eq("placement", "search"),
  ]);

  let favoriteIds: string[] = [];

  if (user) {
    const { data: favorites } = await s
      .from("favorites")
      .select("listing_id")
      .eq("user_id", user.id);

    favoriteIds = (favorites || []).map((x: any) => x.listing_id);
  }

  const listingCandidates = loadAllListingsInitially
    ? (listingSource as any[])
    : ((listingSource as any)?.data || []);
  const initialListingIds = loadAllListingsInitially
    ? undefined
    : sortListingsByDailyDefault(listingCandidates)
        .slice(0, 10)
        .map((listing: any) => listing.id);
  const enriched = loadAllListingsInitially
    ? listingCandidates
    : await fetchHomeListings(s, publicStatuses, initialListingIds);
  const deferRemainingListings =
    !loadAllListingsInitially && listingCandidates.length > enriched.length;

  return (
    <HomeClient
      listings={enriched}
      manufacturers={manufacturers || []}
      materials={materials || []}
      colors={colors || []}
      regions={regions || []}
      subregions={subregions || []}
      userId={user?.id}
      favoriteIds={favoriteIds}
      initial={initial}
      helpNotes={helpNotes || []}
      deferRemainingListings={deferRemainingListings}
    />
  );
}
