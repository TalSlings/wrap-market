import { createClient } from "@/lib/supabase/server";
import HomeClient from "@/components/HomeClient";

export const dynamic = "force-dynamic";

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

  const [
    { data: listings },
    { data: manufacturers },
    { data: materials },
    { data: colors },
    { data: regions },
    { data: subregions },
  ] = await Promise.all([
    s
      .from("listings")
      .select(
        `id,
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
        shipping_available,
        created_at,
        manufacturer:manufacturers(id,name),
        materials:listing_materials(
          material_id,
          percentage,
          material:materials(
            id,
            name,
            parent_material_id,
            vegan,
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
          image_type,
          position
        )`
      )
      .in("status", publicStatuses),

    s
      .from("manufacturers")
      .select("id,name")
      .eq("status", "active")
      .order("name"),

    s
      .from("materials")
      .select(
        "id,name,parent_material_id,vegan,material_origin,is_selectable,status"
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
  ]);

  let favoriteIds: string[] = [];

  if (user) {
    const { data: favorites } = await s
      .from("favorites")
      .select("listing_id")
      .eq("user_id", user.id);

    favoriteIds = (favorites || []).map((x: any) => x.listing_id);
  }

  const rows = listings || [];

  const mainImages: any[] = [];

  for (const l of rows) {
    const im = (l.images || [])
      .filter((x: any) => x.image_type === "listing")
      .sort(
        (a: any, b: any) =>
          Number(a.position || 0) -
          Number(b.position || 0)
      )[0];

    if (im) {
      mainImages.push({
        listingId: l.id,
        path: im.storage_path,
      });
    }
  }

  const imageUrlByListing: Record<
    string,
    string | null
  > = {};

  if (mainImages.length > 0) {
    const { data: signedUrls } = await s.storage
      .from("listing-images")
      .createSignedUrls(
        mainImages.map((x: any) => x.path),
        3600
      );

    mainImages.forEach((image: any, index: number) => {
      imageUrlByListing[image.listingId] =
        signedUrls?.[index]?.signedUrl || null;
    });
  }

  const enriched = rows.map((l: any) => ({
    ...l,
    image_url:
      imageUrlByListing[l.id] || null,
  }));

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
    />
  );
}
