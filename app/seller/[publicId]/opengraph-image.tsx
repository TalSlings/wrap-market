import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

const PAWN_COLORS = [
  ["pawn-01", "#F3D900", "#FFF5A6"],
  ["pawn-02", "#F47A18", "#FFD8B6"],
  ["pawn-03", "#F05243", "#FFD0CB"],
  ["pawn-04", "#E95391", "#FFD3E4"],
  ["pawn-05", "#B733A7", "#F3C9EC"],
  ["pawn-06", "#713BC1", "#DFD0F6"],
  ["pawn-07", "#2257D7", "#CAD8FF"],
  ["pawn-08", "#168EC9", "#C9EBFA"],
  ["pawn-09", "#08AFA7", "#C3F0EC"],
  ["pawn-10", "#16A864", "#C7EFD7"],
  ["pawn-11", "#78B92B", "#DEF0BB"],
  ["pawn-12", "#C9C516", "#F1EFAF"],
] as const;

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
  const pawn =
    PAWN_COLORS.find(([key]) => key === identity?.avatar_key) ||
    PAWN_COLORS[0];

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
        <svg width="560" height="560" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="49" fill={pawn[1]} />
          <circle cx="50" cy="32" r="13" fill={pawn[2]} />
          <path
            d="M38 47h24c0 10-3 17-8 21l15 15H31l15-15c-5-4-8-11-8-21Z"
            fill={pawn[2]}
          />
        </svg>
      )}
    </div>,
    size
  );
}
