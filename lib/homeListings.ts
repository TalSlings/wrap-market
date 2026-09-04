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
  const ids = rows.map((listing: any) => listing.id);
  const firstImagePathByListing: Record<string, string> = {};

  if (ids.length > 0) {
    const { data: images, error: imageError } = await supabase
      .from("listing_images")
      .select("listing_id,storage_path,position")
      .eq("image_type", "listing")
      .in("listing_id", ids)
      .order("position", { ascending: true });

    if (imageError) throw imageError;

    for (const image of images || []) {
      if (!firstImagePathByListing[image.listing_id]) {
        firstImagePathByListing[image.listing_id] = image.storage_path;
      }
    }
  }

  const imageEntries = Object.entries(firstImagePathByListing);
  const signedUrlByPath: Record<string, string> = {};

  if (imageEntries.length > 0) {
    const { data: signedUrls, error: signedUrlError } = await supabase.storage
      .from("listing-images")
      .createSignedUrls(
        imageEntries.map(([, path]) => path),
        3600
      );

    if (signedUrlError) throw signedUrlError;

    for (const item of signedUrls || []) {
      if (item?.path && item?.signedUrl) {
        signedUrlByPath[item.path] = item.signedUrl;
      }
    }
  }

  return rows.map((listing: any) => {
    const path = firstImagePathByListing[listing.id];

    return {
      ...listing,
      image_url: path ? signedUrlByPath[path] || null : null,
    };
  });
}
