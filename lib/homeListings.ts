import "server-only";

import { unstable_cache } from "next/cache";
import { createPublicServerClient } from "@/lib/supabase/public-server";

const HOME_LISTING_SELECT = `id,
  manufacturer_id,
  design,
  model,
  description,
  size,
  gsm,
  price,
  colors,
  color_patterns,
  condition,
  defects,
  material_composition_unknown,
  shipping_available,
  created_at,
  status,
  manufacturer:manufacturers(id,name),
  materials:listing_materials(
    material_id,
    percentage,
    material:materials(
      id,
      name,
      parent_material_id,
      vegan,
      easycare,
      material_origin
    )
  ),
  locations:listing_locations(
    region_id,
    subregion_id,
    region:regions(id,name)
  )`;

export async function fetchHomeListings(
  supabase: any,
  publicStatuses: string[],
  listingIds?: string[]
) {
  if (listingIds && listingIds.length === 0) return [];

  let listingQuery = supabase
    .from("listings")
    .select(HOME_LISTING_SELECT)
    .in("status", publicStatuses);

  if (listingIds) {
    listingQuery = listingQuery.in("id", listingIds);
  }

  const { data: listings, error: listingError } = await listingQuery;
  if (listingError) throw listingError;

  const rows = listings || [];
  const listingIdsToLoad = rows.map((listing: any) => listing.id);
  const imagePathByListing: Record<string, string> = {};

  if (listingIdsToLoad.length > 0) {
    const { data: images, error: imageError } = await supabase
      .from("listing_images")
      .select("listing_id,storage_path,position")
      .eq("image_type", "listing")
      .in("listing_id", listingIdsToLoad)
      .order("position", { ascending: true });

    if (imageError) throw imageError;

    for (const image of images || []) {
      if (!imagePathByListing[image.listing_id]) {
        imagePathByListing[image.listing_id] = image.storage_path;
      }
    }
  }

  return rows.map((listing: any) => {
    const path = imagePathByListing[listing.id];

    return {
      ...listing,
      image_path: path || null,
    };
  });
}

export const fetchCachedHomeListings = unstable_cache(
  async (publicStatuses: string[], listingIds?: string[]) =>
    fetchHomeListings(
      createPublicServerClient(),
      publicStatuses,
      listingIds
    ),
  ["home-listing-cards-v5"],
  { revalidate: 30 }
);
