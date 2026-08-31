import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListingForm from "@/components/ListingForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "הוספת מודעה", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function Page() {
  const s = await createClient();

  const {
    data: { user },
  } = await s.auth.getUser();

  if (!user) {
    redirect("/login?next=/new");
  }

  const { data: isSuspended } =
    await s.rpc("current_user_is_suspended");

  if (isSuspended) {
    redirect("/suspended");
  }

  const [
    { data: manufacturers },
    { data: materials },
    { data: colors },
    { data: regions },
    { data: subregions },
    { data: settings },
  ] = await Promise.all([
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
  ]);

  return (
    <main className="page">
      <h1>הוספת מודעה</h1>

      <ListingForm
        userId={user.id}
        manufacturers={manufacturers || []}
        materials={materials || []}
        colors={colors || []}
        regions={regions || []}
        subregions={subregions || []}
        allowIncomplete={
          !!settings?.allow_incomplete_listings
        }
      />
    </main>
  );
}
