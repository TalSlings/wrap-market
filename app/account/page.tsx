import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountClient from "@/components/AccountClient";
import { getAccountPublicData } from "@/lib/accountPublicData";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const ACCOUNT_TABS = [
  "profile",
  "listings",
  "deleted",
  "favorites",
  "searches",
] as const;
type AccountTab = (typeof ACCOUNT_TABS)[number];

function normalizeTab(value?: string): AccountTab {
  return ACCOUNT_TABS.includes(value as AccountTab)
    ? (value as AccountTab)
    : "profile";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}): Promise<Metadata> {
  const { tab } = await searchParams;
  const normalized = normalizeTab(tab);
  const marketTab = normalized !== "profile";
  return {
    title: marketTab
      ? { absolute: "האזור שלי | רק ארוגים (וטבעות)" }
      : "האזור שלי",
    robots: { index: false, follow: false },
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: requestedTab } = await searchParams;
  const tab = normalizeTab(requestedTab);
  const s = await createClient();

  // The account is protected, so this intentionally remains a verified Auth
  // request. The performance work below removes unrelated database requests.
  const {
    data: { user },
  } = await s.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/account?tab=${tab}`)}`);
  }

  let listings: any[] = [];
  let searches: any[] = [];
  let favorites: any[] = [];
  let profile: any | null = null;
  let regions: any[] = [];
  let subregions: any[] = [];
  let isAdmin = false;
  let sellerPublicId: string | null = null;
  let isSuspended = false;
  let allowIncomplete = false;

  if (tab === "profile") {
    const [
      publicData,
      { data: profileRow },
      { data: adminRow },
      { data: sellerProfile },
      { data: suspended },
    ] = await Promise.all([
      getAccountPublicData(),
      s.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      s.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle(),
      s
        .from("public_seller_profiles")
        .select("public_seller_id")
        .eq("user_id", user.id)
        .maybeSingle(),
      s.rpc("current_user_is_suspended"),
    ]);

    profile = profileRow || null;
    regions = publicData.regions;
    subregions = publicData.subregions;
    allowIncomplete = Boolean(publicData.settings?.allow_incomplete_listings);
    isAdmin = Boolean(adminRow);
    sellerPublicId = sellerProfile?.public_seller_id || null;
    isSuspended = Boolean(suspended);
  } else if (tab === "listings" || tab === "deleted") {
    const listingQuery = s
      .from("listings")
      .select("*,manufacturer:manufacturers(name)")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false });

    const [publicData, { data: listingRows }, { data: suspended }] =
      await Promise.all([
        getAccountPublicData(),
        tab === "deleted"
          ? listingQuery.eq("status", "deleted")
          : listingQuery.neq("status", "deleted"),
        s.rpc("current_user_is_suspended"),
      ]);

    listings = listingRows || [];
    allowIncomplete = Boolean(publicData.settings?.allow_incomplete_listings);
    isSuspended = Boolean(suspended);
  } else if (tab === "favorites") {
    const { data: favoriteRows } = await s
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
          images:listing_images(storage_path,image_type,position)
        )`
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const favoriteListings = (favoriteRows || [])
      .map((row: any) => row.listing)
      .filter((listing: any) => listing && listing.status !== "deleted");
    const imagePathByListing: Record<string, string> = {};

    for (const listing of favoriteListings) {
      const imagePath = [...(listing.images || [])]
        .filter((image: any) => image.image_type === "listing")
        .sort((a: any, b: any) => Number(a.position) - Number(b.position))[0]
        ?.storage_path;
      if (imagePath) imagePathByListing[listing.id] = imagePath;
    }

    const signedUrlByPath: Record<string, string> = {};
    const paths = [...new Set(Object.values(imagePathByListing))];
    if (paths.length > 0) {
      const { data: signedUrls } = await s.storage
        .from("listing-images")
        .createSignedUrls(paths, 3600);

      for (const item of signedUrls || []) {
        if (item?.path && item?.signedUrl) {
          signedUrlByPath[item.path] = item.signedUrl;
        }
      }
    }

    favorites = favoriteListings.map((listing: any) => {
        const imagePath = imagePathByListing[listing.id];
        const { images: _images, ...favorite } = listing;

        return {
          ...favorite,
          image_url: imagePath ? signedUrlByPath[imagePath] || null : null,
        };
      });
  } else {
    const { data: savedSearches } = await s
      .from("saved_searches")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    searches = savedSearches || [];
  }

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
        listings={listings}
        searches={searches}
        favorites={favorites}
        profile={profile}
        regions={regions}
        subregions={subregions}
        email={user.email || ""}
        provider={provider}
        isAdmin={isAdmin}
        sellerPublicId={sellerPublicId}
        isSuspended={isSuspended}
        allowIncomplete={allowIncomplete}
        initialTab={tab}
      />
    </main>
  );
}
