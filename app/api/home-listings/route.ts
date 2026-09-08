import { NextRequest, NextResponse } from "next/server";
import { fetchCachedHomeListings } from "@/lib/homeListings";
import { getHomePublicData } from "@/lib/homePublicData";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const ids = (request.nextUrl.searchParams.get("ids") || "")
      .split(",")
      .filter((id) => /^[0-9a-f-]{36}$/i.test(id))
      .slice(0, 20);

    if (!ids.length) {
      return NextResponse.json({ listings: [] });
    }

    const { settings } = await getHomePublicData();

    const publicStatuses = settings?.allow_incomplete_listings
      ? ["active", "incomplete"]
      : ["active"];
    const listings = await fetchCachedHomeListings(publicStatuses, ids);

    return NextResponse.json({ listings });
  } catch (error) {
    console.error("Could not load remaining home listings", error);
    return NextResponse.json(
      { error: "Could not load listings" },
      { status: 500 }
    );
  }
}
