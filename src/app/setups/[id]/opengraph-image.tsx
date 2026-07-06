import { ImageResponse } from "next/og";
import { getSetupDetail } from "@/db/queries";
import { computeTotals } from "@/lib/totals";
import { formatPrice, formatVolume, formatWeight } from "@/lib/format";
import { OG_COLORS, OG_SIZE, OgBike } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";

export const alt = "Bikepacking setup overview";
export const size = OG_SIZE;
export const contentType = "image/png";

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div
        style={{
          fontSize: 18,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: OG_COLORS.muted,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 44, color: accent ? OG_COLORS.accent : OG_COLORS.ink }}>
        {value}
      </div>
    </div>
  );
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getSetupDetail(Number(id));

  if (!detail) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: OG_COLORS.background,
            color: OG_COLORS.ink,
            fontSize: 64,
          }}
        >
          {SITE_NAME}
        </div>
      ),
      size,
    );
  }

  const totals = computeTotals(detail);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: OG_COLORS.background,
          padding: "60px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 620 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                color: OG_COLORS.muted,
                fontSize: 20,
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              <div style={{ width: 36, height: 5, backgroundColor: OG_COLORS.accent, display: "flex" }} />
              {SITE_NAME} · {detail.setup.bikeStyle}
            </div>
            <div
              style={{
                fontSize: 68,
                color: OG_COLORS.ink,
                marginTop: 14,
                letterSpacing: -2,
                lineHeight: 1.1,
              }}
            >
              {detail.setup.name}
            </div>
            {detail.bike ? (
              <div style={{ fontSize: 26, color: OG_COLORS.muted, marginTop: 10 }}>
                {[detail.bike.brand, detail.bike.name].filter(Boolean).join(" ")}
              </div>
            ) : null}
          </div>
          <OgBike color={detail.setup.bikeColor} width={380} />
        </div>

        <div
          style={{
            display: "flex",
            gap: 72,
            borderTop: `2px solid ${OG_COLORS.line}`,
            paddingTop: 36,
          }}
        >
          <Stat label="Loaded" value={formatWeight(totals.loadedWeightGrams)} accent />
          <Stat label="Bags" value={String(totals.bagCount)} />
          <Stat label="Storage" value={formatVolume(totals.totalVolumeLiters)} />
          <Stat label="Value" value={formatPrice(totals.totalPriceCents)} />
        </div>
      </div>
    ),
    size,
  );
}
