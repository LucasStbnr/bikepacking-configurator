import { ImageResponse } from "next/og";
import { OG_COLORS, OG_SIZE, OgBike } from "@/lib/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} — bikepacking setup builder`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: OG_COLORS.background,
          padding: "72px 88px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 560 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              color: OG_COLORS.muted,
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            <div style={{ width: 44, height: 6, backgroundColor: OG_COLORS.accent, display: "flex" }} />
            Bikepacking setup builder
          </div>
          <div style={{ fontSize: 110, color: OG_COLORS.ink, marginTop: 16, letterSpacing: -3 }}>
            {SITE_NAME}
          </div>
          <div style={{ fontSize: 28, color: OG_COLORS.muted, marginTop: 12, lineHeight: 1.45 }}>
            {SITE_DESCRIPTION}
          </div>
        </div>
        <OgBike color={OG_COLORS.blueprint} width={440} />
      </div>
    ),
    size,
  );
}
