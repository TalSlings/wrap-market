import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchHomeListings } from "@/lib/homeListings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: settings } = await supabase
      .from("site_settings")
      .select("allow_incomplete_listings")
      .eq("singleton", true)
      .maybeSingle();

    const publicStatuses = settings?.allow_incomplete_listings
      ? ["active", "incomplete"]
      : ["active"];
    const listings = await fetchHomeListings(supabase, publicStatuses);

    return NextResponse.json({ listings });
  } catch (error) {
    console.error("Could not load remaining home listings", error);
    return NextResponse.json(
      { error: "Could not load listings" },
      { status: 500 }
    );
  }
}
