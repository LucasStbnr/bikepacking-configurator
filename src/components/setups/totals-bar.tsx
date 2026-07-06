"use client";

import type { SetupTotals } from "@/lib/totals";
import { formatPrice, formatVolume, formatWeight } from "@/lib/format";

const SEGMENT_COLORS = [
  "var(--blueprint)",
  "var(--accent)",
  "#6a7d5e",
  "#b98d4f",
  "#7d3a3a",
  "#55606e",
  "#8a6fa8",
];

export function TotalsBar({ totals }: { totals: SetupTotals }) {
  const carried = totals.bagsWeightGrams + totals.gearWeightGrams;

  return (
    <div className="sticky bottom-4 z-20 rounded-lg border border-line bg-surface/95 px-5 py-4 shadow-lg shadow-ink/8 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <Stat label="Loaded weight" value={formatWeight(totals.loadedWeightGrams)} strong />
        <Stat label="Bike" value={formatWeight(totals.bikeWeightGrams)} />
        <Stat label="Carried" value={formatWeight(carried)} />
        <Stat label="Storage" value={formatVolume(totals.totalVolumeLiters)} />
        <Stat label="Total value" value={formatPrice(totals.totalPriceCents)} />

        {carried > 0 ? (
          <div className="min-w-48 flex-1">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="spec-label !text-[9px]">Weight distribution</span>
            </div>
            <div className="flex h-2.5 w-full gap-px overflow-hidden rounded-full bg-line/60">
              {totals.perBag
                .filter((b) => b.weightGrams > 0)
                .map((b, i) => (
                  <div
                    key={b.bagId ?? "loose"}
                    title={`${b.label} — ${formatWeight(b.weightGrams)}`}
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${(b.weightGrams / carried) * 100}%`,
                      backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                      opacity: 0.85,
                    }}
                  />
                ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="spec-label !text-[9px]">{label}</span>
      <span
        className={
          strong
            ? "font-mono text-lg font-semibold leading-none text-accent-hover"
            : "font-mono text-sm leading-none text-ink"
        }
      >
        {value}
      </span>
    </div>
  );
}
