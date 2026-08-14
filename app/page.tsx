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
        `*,
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
      .eq("status", "active"),

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

  const enriched = [] as any[];

  for (const l of listings || []) {
    const im = (l.images || [])
      .filter((x: any) => x.image_type === "listing")
      .sort((a: any, b: any) => a.position - b.position)[0];

    let image_url = null;

    if (im) {
      const { data } = await s.storage
        .from("listing-images")
        .createSignedUrl(im.storage_path, 3600);

      image_url = data?.signedUrl || null;
    }

    enriched.push({
      ...l,
      image_url,
    });
  }

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
