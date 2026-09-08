import { NextRequest, NextResponse } from "next/server";
import { createPublicServerClient } from "@/lib/supabase/public-server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const supabase = createPublicServerClient();
    const [{ data: settings }, { data: listing }] = await Promise.all([
      supabase
        .from("site_settings")
        .select("allow_incomplete_listings")
        .eq("singleton", true)
        .maybeSingle(),
      supabase.from("listings").select("status").eq("id", id).maybeSingle(),
    ]);

    const allowedStatuses = settings?.allow_incomplete_listings
      ? ["active", "incomplete"]
      : ["active"];
    if (!listing || !allowedStatuses.includes(listing.status)) {
      return new NextResponse(null, { status: 404 });
    }

    const { data: image } = await supabase
      .from("listing_images")
      .select("storage_path")
      .eq("listing_id", id)
      .eq("image_type", "listing")
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!image?.storage_path) {
      return new NextResponse(null, { status: 404 });
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from("listing-images")
      .createSignedUrl(image.storage_path, 300);
    if (signedError || !signed?.signedUrl) throw signedError;

    const source = await fetch(signed.signedUrl);
    if (!source.ok || !source.body) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(source.body, {
      headers: {
        "Content-Type": source.headers.get("content-type") || "image/jpeg",
        "Cache-Control":
          "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Could not load listing thumbnail", error);
    return new NextResponse(null, { status: 500 });
  }
}
