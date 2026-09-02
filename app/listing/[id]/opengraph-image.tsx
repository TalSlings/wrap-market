import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const alt = "תמונת המנשא במודעה";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

function fallbackImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fbfaff",
      }}
    >
      <div
        style={{
          width: 280,
          height: 280,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#7d6cd1",
          color: "#fff",
          fontSize: 170,
          lineHeight: 1,
        }}
      >
        #
      </div>
    </div>,
    size
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("status,images:listing_images(storage_path,image_type,position)")
    .eq("id", id)
    .maybeSingle();

  if (!listing || !["active", "incomplete"].includes(listing.status)) {
    return fallbackImage();
  }

  const image = (listing.images || [])
    .filter((item: any) => item.image_type === "listing")
    .sort(
      (a: any, b: any) => Number(a.position || 0) - Number(b.position || 0)
    )[0];

  if (!image) return fallbackImage();

  const { data } = await supabase.storage
    .from("listing-images")
    .createSignedUrl(image.storage_path, 300);

  if (!data?.signedUrl) return fallbackImage();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fbfaff",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={data.signedUrl}
        alt=""
        width="1200"
        height="630"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>,
    size
  );
}
