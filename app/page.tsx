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

  // Start all independent homepage requests together. Previously authentication
  // and settings each blocked the catalogue requests that followed them.
  const [
    { data: authData },
    { data: settings },
    { data: manufacturers },
    { data: materials },
    { data: colors },
    { data: regions },
    { data: subregions },
    { data: helpNotes },
  ] = await Promise.all([
    s.auth.getUser(),
    s
      .from("site_settings")
      .select("allow_incomplete_listings")
      .eq("singleton", true)
      .maybeSingle(),
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

  const user = authData.user;

  const publicStatuses = settings?.allow_incomplete_listings
    ? ["active", "incomplete"]
    : ["active"];

  const loadAllListingsInitially = Boolean(sp.shared);

  const [listingSource, favoriteSource] = await Promise.all([
    loadAllListingsInitially
      ? fetchHomeListings(s, publicStatuses)
      : s
          .from("listings")
          .select("id,status")
          .in("status", publicStatuses),
    user
      ? s
          .from("favorites")
          .select("listing_id")
          .eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
  ]);

  const favoriteIds = (favoriteSource.data || []).map(
    (favorite: any) => favorite.listing_id
  );

  const listingCandidates = loadAllListingsInitially
    ? (listingSource as any[])
    : ((listingSource as any)?.data || []);
  const sortedListingIds = loadAllListingsInitially
    ? []
    : sortListingsByDailyDefault(listingCandidates).map(
        (listing: any) => listing.id
      );
  const initialListingIds = loadAllListingsInitially
    ? undefined
    : sortedListingIds.slice(0, 10);
  const enriched = loadAllListingsInitially
    ? listingCandidates
    : await fetchHomeListings(s, publicStatuses, initialListingIds);
  const remainingListingIds = loadAllListingsInitially
    ? []
    : sortedListingIds.slice(10);

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
      remainingListingIds={remainingListingIds}
    />
  );
}
