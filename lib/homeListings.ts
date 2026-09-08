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
  ),
  images:listing_images(
    storage_path,
    position,
    image_type
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

  return (listings || []).map((listing: any) => {
    const path = [...(listing.images || [])]
      .filter((image: any) => image.image_type === "listing")
      .sort((a: any, b: any) => a.position - b.position)[0]?.storage_path;
    const { images: _images, ...publicListing } = listing;

    return {
      ...publicListing,
      image_url: path
        ? `/api/listing-thumbnail/${listing.id}?v=${encodeURIComponent(path)}`
        : null,
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
  ["home-listing-cards-v2"],
  { revalidate: 30 }
);
import "server-only";

import { unstable_cache } from "next/cache";
import { createPublicServerClient } from "@/lib/supabase/public-server";
