import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const alt = "תמונת הפרופיל במדף המוכרת";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const supabase = await createClient();
  const { data: identityRows } = await supabase.rpc(
    "get_public_seller_identity",
    { p_public_seller_id: publicId }
  );
  const identity = identityRows?.[0] || null;
  const profileImageUrl = identity?.profile_image_path
    ? supabase.storage
        .from("profile-images")
        .getPublicUrl(identity.profile_image_path).data.publicUrl
    : null;

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
      {profileImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profileImageUrl}
          alt=""
          width="560"
          height="560"
          style={{
            width: 560,
            height: 560,
            borderRadius: 999,
            objectFit: "cover",
          }}
        />
      ) : (
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
      )}
    </div>,
    size
  );
}
