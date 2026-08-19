import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminClient from "@/components/AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const s = await createClient();

  const {
    data: { user },
  } = await s.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: adminRow } = await s
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) {
    redirect("/account");
  }

  const [
    { data: listings },
    { data: manufacturers },
    { data: materials },
    { data: colors },
    { data: regions },
    { data: subregions },
    { data: notes },
    { data: sellers },
    { data: feedbackItems },
  ] = await Promise.all([
    s
      .from("listings")
      .select(
        `id,owner_id,manufacturer_id,design,model,price,status,created_at,updated_at,
        manufacturer:manufacturers(name)`
      )
      .neq("status", "deleted")
      .order("updated_at", { ascending: false }),

    s.from("manufacturers").select("*").order("name"),
    s.from("materials").select("*").order("name"),
    s.from("colors").select("*").order("sort_order"),
    s.from("regions").select("*").order("sort_order"),
    s.from("subregions").select("*").order("sort_order"),
    s.from("help_notes").select("*").order("section_label").order("placement"),
    s.rpc("admin_list_sellers"),

    s
      .from("feedback_items")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <main className="page">
      <h1>אזור מנהלות</h1>

      <AdminClient
        userId={user.id}
        listings={listings || []}
        manufacturers={manufacturers || []}
        materials={materials || []}
        colors={colors || []}
        regions={regions || []}
        subregions={subregions || []}
        notes={notes || []}
        sellers={sellers || []}
        feedbackItems={feedbackItems || []}
      />
    </main>
  );
}
