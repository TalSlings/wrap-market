import { createClient } from "@/lib/supabase/server";
import HomeClient from "@/components/HomeClient";
import type { Metadata } from "next";
import { fetchCachedHomeListings } from "@/lib/homeListings";
import { sortListingsByDailyDefault } from "@/lib/listingSort";
import {
  getHomeListingCandidates,
  getHomePublicData,
} from "@/lib/homePublicData";

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
  const [{ data: authData }, publicData] = await Promise.all([
    s.auth.getSession(),
    getHomePublicData(),
  ]);
  const user = authData.session?.user || null;
  const {
    settings,
    manufacturers,
    materials,
    colors,
    regions,
    subregions,
    helpNotes,
  } = publicData;

  const publicStatuses = settings?.allow_incomplete_listings
    ? ["active", "incomplete"]
    : ["active"];

  const loadAllListingsInitially = Boolean(sp.shared);

  const listingSource = loadAllListingsInitially
    ? await fetchCachedHomeListings(publicStatuses)
    : await getHomeListingCandidates(
        Boolean(settings?.allow_incomplete_listings)
      );

  const listingCandidates = loadAllListingsInitially
    ? (listingSource as any[])
    : (listingSource as any[]);
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
    : await fetchCachedHomeListings(publicStatuses, initialListingIds);
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
      favoriteIds={[]}
      initial={initial}
      helpNotes={helpNotes || []}
      remainingListingIds={remainingListingIds}
    />
  );
}
