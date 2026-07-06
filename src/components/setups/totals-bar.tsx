"use client";

import { useId, useState } from "react";
import type { SetupTotals } from "@/lib/totals";
import { formatPrice, formatVolume, formatWeight } from "@/lib/format";
import { cn } from "@/lib/utils";

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
  const segments = totals.perBag.filter((b) => b.weightGrams > 0);

  return (
    <div className="sticky bottom-4 z-20 rounded-lg border border-line bg-surface/95 px-5 py-4 shadow-lg shadow-ink/8 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <Stat label="Loaded weight" value={formatWeight(totals.loadedWeightGrams)} strong />
        <Stat label="Bike" value={formatWeight(totals.bikeWeightGrams)} />
        <Stat label="Carried" value={formatWeight(carried)} />
        <Stat label="Storage" value={formatVolume(totals.totalVolumeLiters)} />
        <Stat label="Total value" value={formatPrice(totals.totalPriceCents)} />

        {carried > 0 ? (
          <WeightDistribution segments={segments} carried={carried} />
        ) : null}
      </div>
    </div>
  );
}

function WeightDistribution({
  segments,
  carried,
}: {
  segments: SetupTotals["perBag"];
  carried: number;
}) {
  // Details are hidden by default and revealed on hover (pointer devices).
  // Touch devices have no hover, so tapping the bar toggles them instead.
  const [open, setOpen] = useState(false);
  const legendId = useId();

  return (
    <div className="group min-w-56 flex-1 basis-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={legendId}
        className="w-full cursor-pointer text-left"
      >
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className="spec-label !text-[9px]">Weight distribution</span>
          <span className="font-mono text-[9px] text-faint">
            of {formatWeight(carried)} carried
          </span>
        </div>
        <div className="flex h-2.5 w-full gap-px overflow-hidden rounded-full bg-line/60">
          {segments.map((b, i) => (
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
      </button>
      <ul
        id={legendId}
        className={cn(
          "flex-wrap gap-x-4 gap-y-1",
          // Revealed on tap (open) or on hover. In Tailwind v4 `group-hover`
          // is gated behind `@media (hover: hover)`, so it never fires on
          // touch devices — those rely on the tap toggle above.
          open ? "mt-2 flex" : "hidden",
          "group-hover:mt-2 group-hover:flex",
        )}
      >
        {segments.map((b, i) => (
          <li key={b.bagId ?? "loose"} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-sm"
              style={{
                backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                opacity: 0.85,
              }}
            />
            <span className="truncate text-[11px] text-muted">{b.label}</span>
            <span className="font-mono text-[10px] text-faint">
              {formatWeight(b.weightGrams)} · {Math.round((b.weightGrams / carried) * 100)}%
            </span>
          </li>
        ))}
      </ul>
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
