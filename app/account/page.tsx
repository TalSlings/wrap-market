import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountClient from "@/components/AccountClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const s = await createClient();

  const {
    data: { user },
  } = await s.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const [
    { data: listings },
    { data: searches },
    { data: favoriteRows },
  ] = await Promise.all([
    s
      .from("listings")
      .select("*,manufacturer:manufacturers(name)")
      .eq("owner_id", user.id)
      .neq("status", "deleted")
      .order("updated_at", { ascending: false }),

    s
      .from("saved_searches")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),

    s
      .from("favorites")
      .select(
        `listing_id,
        created_at,
        listing:listings(
          id,
          design,
          model,
          price,
          status,
          manufacturer:manufacturers(name)
        )`
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const favorites = (favoriteRows || [])
    .map((row: any) => row.listing)
    .filter(
      (listing: any) =>
        listing &&
        listing.status !== "deleted"
    );

  const provider =
    user.app_metadata?.provider === "google"
      ? "Google"
      : user.app_metadata?.provider === "email"
        ? "Email"
        : user.app_metadata?.provider || "לא ידוע";

  return (
    <main className="page">
      <h1>האזור שלי</h1>

      <AccountClient
        listings={listings || []}
        searches={searches || []}
        favorites={favorites}
        email={user.email || ""}
        provider={provider}
      />
    </main>
  );
}
