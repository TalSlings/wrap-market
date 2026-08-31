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
    { data: profile },
    { data: regions },
    { data: subregions },
    { data: adminRow },
    { data: sellerProfile },
    { data: isSuspended },
    { data: settings },
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
          manufacturer:manufacturers(name),
          images:listing_images(
            storage_path,
            image_type,
            position
          )
        )`
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),

    s
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),

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
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle(),

    s
      .from("public_seller_profiles")
      .select("public_seller_id")
      .eq("user_id", user.id)
      .maybeSingle(),

    s.rpc("current_user_is_suspended"),

    s
      .from("site_settings")
      .select("allow_incomplete_listings")
      .eq("singleton", true)
      .maybeSingle(),
  ]);

  const favoriteListings = (favoriteRows || [])
    .map((row: any) => row.listing)
    .filter(
      (listing: any) =>
        listing &&
        listing.status !== "deleted"
    );

  const favoriteMainImages = favoriteListings
    .map((listing: any) => {
      const image = (listing.images || [])
        .filter((x: any) => x.image_type === "listing")
        .sort(
          (a: any, b: any) =>
            Number(a.position || 0) - Number(b.position || 0)
        )[0];

      return image
        ? { listingId: listing.id, path: image.storage_path }
        : null;
    })
    .filter(Boolean) as { listingId: string; path: string }[];

  const favoriteImageUrlByListing: Record<string, string> = {};

  if (favoriteMainImages.length > 0) {
    const { data: signedUrls } = await s.storage
      .from("listing-images")
      .createSignedUrls(
        favoriteMainImages.map((x) => x.path),
        3600
      );

    const signedByPath: Record<string, string> = {};

    for (const item of signedUrls || []) {
      if (item?.path && item?.signedUrl) {
        signedByPath[item.path] = item.signedUrl;
      }
    }

    for (const image of favoriteMainImages) {
      const signedUrl = signedByPath[image.path];
      if (signedUrl) {
        favoriteImageUrlByListing[image.listingId] = signedUrl;
      }
    }
  }

  const favorites = favoriteListings.map((listing: any) => ({
    ...listing,
    image_url: favoriteImageUrlByListing[listing.id] || null,
  }));

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
        userId={user.id}
        listings={listings || []}
        searches={searches || []}
        favorites={favorites}
        profile={profile || null}
        regions={regions || []}
        subregions={subregions || []}
        email={user.email || ""}
        provider={provider}
        isAdmin={!!adminRow}
        sellerPublicId={
          sellerProfile?.public_seller_id || null
        }
        isSuspended={!!isSuspended}
        allowIncomplete={
          !!settings?.allow_incomplete_listings
        }
      />
    </main>
  );
}
