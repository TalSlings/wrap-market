import { ImageResponse } from "next/og";

export const alt = "רק ארוגים (וטבעות) — לוח יד שנייה למנשאים ארוגים";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
          width: 310,
          height: 310,
          borderRadius: 999,
          background: "#7d6cd1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 190,
          fontWeight: 300,
          lineHeight: 1,
        }}
      >
        #
      </div>
    </div>,
    size
  );
}
