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
        gap: 64,
        direction: "rtl",
        background: "#fbfaff",
        color: "#111",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: 250,
          height: 250,
          borderRadius: 999,
          background: "#7d6cd1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 150,
          fontWeight: 300,
          lineHeight: 1,
        }}
      >
        #
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <div style={{ fontSize: 76, fontWeight: 800 }}>רק ארוגים</div>
        <div style={{ fontSize: 46, marginTop: 12 }}>(וטבעות)</div>
        <div style={{ fontSize: 30, marginTop: 30 }}>לוח יד שנייה למנשאים ארוגים</div>
      </div>
    </div>,
    size
  );
}
