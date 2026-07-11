/* Server-side setup images (Satori via next/og): social card + shareable recap. */

import { ImageResponse } from "next/og";
import type { SetupDetail } from "@/db/queries";
import { computeTotals } from "@/lib/totals";
import { formatPrice, formatVolume, formatWeight } from "@/lib/format";
import { MOUNT_POINT_LABELS } from "@/db/schema";
import { OG_COLORS, OG_SIZE, OgBike } from "@/lib/og";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const RECAP_SIZE = { width: 1080, height: 1350 };

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

/** 1200×630 social card (used as opengraph-image for setup and share pages). */
export function renderSetupOg(detail: SetupDetail): ImageResponse {
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
    OG_SIZE,
  );
}

const MAX_RECAP_BAGS = 10;

/** 1080×1350 portrait recap image — bike, mounted bags and headline stats. */
export function renderSetupRecap(detail: SetupDetail): ImageResponse {
  const totals = computeTotals(detail);
  const bags = detail.bags.slice(0, MAX_RECAP_BAGS);
  const hiddenBags = detail.bags.length - bags.length;
  const siteHost = SITE_URL.replace(/^https?:\/\//, "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: OG_COLORS.background,
          padding: "56px 72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Header */}
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
            fontSize: 62,
            color: OG_COLORS.ink,
            marginTop: 12,
            letterSpacing: -2,
            lineHeight: 1.1,
          }}
        >
          {detail.setup.name}
        </div>
        {detail.bike ? (
          <div style={{ fontSize: 25, color: OG_COLORS.muted, marginTop: 8, display: "flex" }}>
            {[detail.bike.brand, detail.bike.name].filter(Boolean).join(" ")}
            {detail.wheels ? ` · ${detail.wheels.name}` : ""}
          </div>
        ) : null}

        {/* Bike graphic */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 28, marginBottom: 20 }}>
          <OgBike color={detail.setup.bikeColor} width={540} />
        </div>

        {/* Mounted bags & accessories */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            borderTop: `2px solid ${OG_COLORS.line}`,
            paddingTop: 26,
          }}
        >
          <div
            style={{
              fontSize: 18,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: OG_COLORS.muted,
              marginBottom: 14,
            }}
          >
            On the bike
          </div>
          {bags.length === 0 ? (
            <div style={{ fontSize: 24, color: OG_COLORS.faint, display: "flex" }}>
              No bags mounted yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {bags.map((bag) => (
                <div
                  key={bag.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 24,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 16, minWidth: 0 }}>
                    <div style={{ fontSize: 26, color: OG_COLORS.ink, display: "flex" }}>
                      {bag.product.name}
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                        color: OG_COLORS.faint,
                        display: "flex",
                      }}
                    >
                      {MOUNT_POINT_LABELS[bag.mountPoint]}
                    </div>
                  </div>
                  <div style={{ fontSize: 22, color: OG_COLORS.muted, display: "flex" }}>
                    {bag.product.weightGrams != null ? formatWeight(bag.product.weightGrams) : "—"}
                    {bag.product.volumeLiters != null
                      ? ` · ${formatVolume(bag.product.volumeLiters)}`
                      : ""}
                  </div>
                </div>
              ))}
              {hiddenBags > 0 ? (
                <div style={{ fontSize: 22, color: OG_COLORS.faint, display: "flex" }}>
                  +{hiddenBags} more
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: 64,
            borderTop: `2px solid ${OG_COLORS.line}`,
            paddingTop: 32,
          }}
        >
          <Stat label="Loaded" value={formatWeight(totals.loadedWeightGrams)} accent />
          <Stat label="Bags" value={String(totals.bagCount)} />
          <Stat label="Items" value={String(totals.itemCount)} />
          <Stat label="Storage" value={formatVolume(totals.totalVolumeLiters)} />
          <Stat label="Value" value={formatPrice(totals.totalPriceCents)} />
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 30,
            fontSize: 17,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: OG_COLORS.faint,
          }}
        >
          <div style={{ display: "flex" }}>{SITE_NAME} — plan the load, ride far</div>
          <div style={{ display: "flex" }}>{siteHost}</div>
        </div>
      </div>
    ),
    RECAP_SIZE,
  );
}
