import {
  redirect,
  notFound,
} from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListingForm from "@/components/ListingForm";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const s = await createClient();

  const {
    data: { user },
  } = await s.auth.getUser();

  if (!user) {
    redirect(`/login?next=/listing/${id}/edit`);
  }

  const { data: isSuspended } =
    await s.rpc("current_user_is_suspended");

  if (isSuspended) {
    redirect("/suspended");
  }

  const [
    { data: l },
    { data: manufacturers },
    { data: materials },
    { data: colors },
    { data: regions },
    { data: subregions },
    { data: settings },
    { data: helpNotes },
  ] = await Promise.all([
    s
      .from("listings")
      .select(
        `*,
        materials:listing_materials(material_id,percentage),
        locations:listing_locations(region_id,subregion_id),
        images:listing_images(id,storage_path,image_type,position)`
      )
      .eq("id", id)
      .eq("owner_id", user.id)
      .single(),

    s
      .from("manufacturers")
      .select("id,name")
      .eq("status", "active")
      .order("name"),

    s
      .from("materials")
      .select(
        "id,name,parent_material_id,vegan,easycare,material_origin,is_selectable"
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
      .from("site_settings")
      .select("allow_incomplete_listings")
      .eq("singleton", true)
      .maybeSingle(),

    s
      .from("help_notes")
      .select("section_key,placement,content,is_visible")
      .eq("placement", "form"),
  ]);

  if (!l) {
    notFound();
  }

  return (
    <main className="page">
      <h1>עריכת מודעה</h1>

      <ListingForm
        initial={l}
        userId={user.id}
        manufacturers={manufacturers || []}
        materials={materials || []}
        colors={colors || []}
        regions={regions || []}
        subregions={subregions || []}
        allowIncomplete={
          !!settings?.allow_incomplete_listings
        }
        helpNotes={helpNotes || []}
      />
    </main>
  );
}
