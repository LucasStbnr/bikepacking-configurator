"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { deleteSetup, mountBag, unmountBag, updateSetup } from "@/actions/setups";
import { BikeDiagram } from "@/components/bike/bike-diagram";
import {
  getGeometry,
  VIEW_H,
  VIEW_W,
  zoneLayouts,
  type DiagramZone,
} from "@/components/bike/geometry";
import { GearPanel } from "@/components/setups/gear-panel";
import { TotalsBar } from "@/components/setups/totals-bar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  BIKE_STYLES,
  MOUNT_POINT_LABELS,
  type BikeStyle,
  type Product,
} from "@/db/schema";
import type { SetupDetail } from "@/db/queries";
import type { SetupTotals } from "@/lib/totals";
import { track } from "@/lib/analytics";
import { formatVolume, formatWeight } from "@/lib/format";
import { cn } from "@/lib/utils";

const STYLE_LABELS: Record<BikeStyle, string> = {
  gravel: "Gravel",
  road: "Road",
  mtb: "MTB",
  touring: "Touring",
};

const FRAME_COLORS = [
  "#1a1a17",
  "#3d6ba3",
  "#6a7d5e",
  "#7d3a3a",
  "#b98d4f",
  "#55606e",
  "#e8500b",
] as const;

export function ConfiguratorView({
  detail,
  products,
  totals,
}: {
  detail: SetupDetail;
  products: Product[];
  totals: SetupTotals;
}) {
  const { setup, wheels, bags, items } = detail;
  const [, startTransition] = useTransition();

  // Optimistic local state so the diagram reacts instantly
  const [style, setStyle] = useState<BikeStyle>(setup.bikeStyle);
  const [color, setColor] = useState(setup.bikeColor);
  const [openZone, setOpenZone] = useState<DiagramZone | null>(null);

  const bikes = products.filter((p) => p.category === "bike");
  const wheelsets = products.filter((p) => p.category === "wheels");
  const bagProducts = useMemo(
    () => products.filter((p) => p.category === "bag" || p.category === "accessory"),
    [products],
  );

  const layouts = zoneLayouts(getGeometry(style, wheels?.tireWidthMm));
  const openBag = openZone ? bags.find((b) => b.mountPoint === openZone) : undefined;
  const compatibleBags = useMemo(
    () =>
      openZone
        ? bagProducts.filter((p) => p.mountPoints?.includes(openZone))
        : [],
    [bagProducts, openZone],
  );
  const otherBags = useMemo(
    () =>
      openZone ? bagProducts.filter((p) => !p.mountPoints?.includes(openZone)) : [],
    [bagProducts, openZone],
  );

  function changeStyle(next: BikeStyle) {
    setStyle(next);
    startTransition(() => updateSetup(setup.id, { bikeStyle: next }));
    track("setup_style_changed", { style: next });
  }

  function changeColor(next: string) {
    setColor(next);
    startTransition(() => updateSetup(setup.id, { bikeColor: next }));
  }

  function pickBag(product: Product) {
    if (!openZone) return;
    const zone = openZone;
    setOpenZone(null);
    startTransition(() => mountBag(setup.id, product.id, zone));
    track("bag_mounted", { mount_point: zone, product: product.name });
  }

  function removeBag() {
    if (!openBag) return;
    const bagId = openBag.id;
    setOpenZone(null);
    startTransition(() => unmountBag(setup.id, bagId));
    track("bag_removed", { mount_point: openBag.mountPoint });
  }

  function remove() {
    if (!window.confirm(`Delete “${setup.name}” and its packing list?`)) return;
    track("setup_deleted");
    startTransition(() => deleteSetup(setup.id));
  }

  const anchorPos = openZone
    ? {
        left: `${(layouts[openZone].anchor[0] / VIEW_W) * 100}%`,
        top: `${(layouts[openZone].anchor[1] / VIEW_H) * 100}%`,
      }
    : null;

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <input
            defaultValue={setup.name}
            aria-label="Setup name"
            onBlur={(e) => {
              const name = e.target.value.trim();
              if (name && name !== setup.name)
                startTransition(() => updateSetup(setup.id, { name }));
            }}
            className="-mx-1 w-full max-w-md rounded-md px-1 font-display text-2xl font-semibold tracking-tight outline-none transition-colors hover:bg-line/40 focus:bg-surface focus:ring-2 focus:ring-accent/30"
          />
          <input
            defaultValue={setup.description ?? ""}
            aria-label="Setup description"
            placeholder="Add a description…"
            onBlur={(e) => {
              const description = e.target.value.trim() || null;
              if (description !== setup.description)
                startTransition(() => updateSetup(setup.id, { description }));
            }}
            className="-mx-1 mt-0.5 w-full max-w-md rounded-md px-1 text-sm text-muted outline-none transition-colors placeholder:text-faint hover:bg-line/40 focus:bg-surface focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="danger" size="sm" onClick={remove}>
            Delete
          </Button>
          <Link
            href={`/setups/${setup.id}/checklist`}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            onClick={() => track("checklist_opened")}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M2 7.5l3 3L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Checklist
          </Link>
        </div>
      </div>

      {/* Bike controls strip */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-line bg-surface px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="spec-label">Bike</span>
          <select
            value={setup.bikeProductId ?? ""}
            onChange={(e) =>
              startTransition(() =>
                updateSetup(setup.id, {
                  bikeProductId: e.target.value ? Number(e.target.value) : null,
                }),
              )
            }
            className="h-8 cursor-pointer rounded-md border border-line-strong bg-surface px-2 text-sm outline-none focus:border-accent"
          >
            <option value="">— none —</option>
            {bikes.map((b) => (
              <option key={b.id} value={b.id}>
                {b.brand ? `${b.brand} ` : ""}{b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="spec-label">Wheels</span>
          <select
            value={setup.wheelProductId ?? ""}
            onChange={(e) => {
              const wheelProductId = e.target.value ? Number(e.target.value) : null;
              startTransition(() => updateSetup(setup.id, { wheelProductId }));
              const picked = wheelsets.find((w) => w.id === wheelProductId);
              track("wheels_changed", {
                wheels: picked?.name ?? "none",
                tire_mm: picked?.tireWidthMm ?? 0,
              });
            }}
            className="h-8 cursor-pointer rounded-md border border-line-strong bg-surface px-2 text-sm outline-none focus:border-accent"
          >
            <option value="">— none —</option>
            {wheelsets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
                {w.tireWidthMm ? ` · ${w.tireWidthMm}mm` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="spec-label">Style</span>
          <div className="flex rounded-md border border-line-strong p-0.5">
            {BIKE_STYLES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => changeStyle(s)}
                className={cn(
                  "cursor-pointer rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  style === s ? "bg-ink text-background" : "text-muted hover:text-ink",
                )}
              >
                {STYLE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="spec-label">Color</span>
          <div className="flex items-center gap-1.5">
            {FRAME_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Frame color ${c}`}
                onClick={() => changeColor(c)}
                className={cn(
                  "size-5 cursor-pointer rounded-full border transition-transform hover:scale-110",
                  color === c ? "border-ink ring-2 ring-accent/40" : "border-ink/15",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
            <label
              className="relative size-5 cursor-pointer overflow-hidden rounded-full border border-dashed border-line-strong transition-transform hover:scale-110"
              style={{
                background:
                  "conic-gradient(#e8500b,#b98d4f,#6a7d5e,#3d6ba3,#7d3a3a,#e8500b)",
              }}
              title="Custom color"
            >
              <input
                type="color"
                value={color}
                onChange={(e) => changeColor(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Custom frame color"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Diagram + gear panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="relative rounded-lg border border-line bg-surface p-2">
          <BikeDiagram
            bikeStyle={style}
            color={color}
            bags={bags}
            tireMm={wheels?.tireWidthMm}
            selectedZone={openZone}
            onZoneSelect={(zone) => setOpenZone(openZone === zone ? null : zone)}
            className="h-auto w-full"
          />
          <p className="pointer-events-none absolute right-4 top-3 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            Click a marker to mount a bag
          </p>

          <Popover open={openZone !== null} onOpenChange={(o) => !o && setOpenZone(null)}>
            {anchorPos ? (
              <PopoverAnchor asChild>
                <span className="pointer-events-none absolute size-0" style={anchorPos} />
              </PopoverAnchor>
            ) : null}
            <PopoverContent align="center" side="bottom">
              {openZone ? (
                <div className="flex flex-col">
                  <p className="spec-label px-2 pb-1.5 pt-1">
                    {MOUNT_POINT_LABELS[openZone]}
                  </p>
                  {openBag ? (
                    <div className="mb-1 flex items-center justify-between gap-2 rounded-md bg-accent-soft/60 px-2 py-1.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{openBag.product.name}</p>
                        <p className="font-mono text-[10px] text-muted">
                          {openBag.product.weightGrams != null
                            ? formatWeight(openBag.product.weightGrams)
                            : "—"}
                          {openBag.product.volumeLiters != null
                            ? ` · ${formatVolume(openBag.product.volumeLiters)}`
                            : ""}
                        </p>
                      </div>
                      <Button variant="danger" size="sm" onClick={removeBag}>
                        Remove
                      </Button>
                    </div>
                  ) : null}
                  <div className="max-h-64 overflow-y-auto">
                    {compatibleBags.length === 0 && otherBags.length === 0 ? (
                      <p className="px-2 py-3 text-sm text-muted">
                        No bags in your library yet.{" "}
                        <Link href="/products" className="text-accent underline">
                          Add some
                        </Link>
                        .
                      </p>
                    ) : null}
                    {compatibleBags
                      .filter((p) => p.id !== openBag?.productId)
                      .map((p) => (
                        <BagOption key={p.id} product={p} onPick={() => pickBag(p)} />
                      ))}
                    {otherBags.length > 0 ? (
                      <>
                        <p className="spec-label px-2 pb-1 pt-2 !text-[9px]">
                          Not marked for this spot
                        </p>
                        {otherBags
                          .filter((p) => p.id !== openBag?.productId)
                          .map((p) => (
                            <BagOption key={p.id} product={p} onPick={() => pickBag(p)} dim />
                          ))}
                      </>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </PopoverContent>
          </Popover>
        </div>

        <GearPanel setupId={setup.id} bags={bags} items={items} products={products} />
      </div>

      <TotalsBar totals={totals} />
    </div>
  );
}

function BagOption({
  product,
  onPick,
  dim,
}: {
  product: Product;
  onPick: () => void;
  dim?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "flex w-full cursor-pointer items-baseline justify-between gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-line/50",
        dim && "opacity-60",
      )}
    >
      <span className="min-w-0">
        <span className="block truncate text-sm">{product.name}</span>
        {product.brand ? (
          <span className="font-mono text-[10px] uppercase tracking-wide text-faint">
            {product.brand}
          </span>
        ) : null}
      </span>
      <span className="shrink-0 font-mono text-[11px] text-muted">
        {product.weightGrams != null ? formatWeight(product.weightGrams) : ""}
        {product.volumeLiters != null ? ` · ${formatVolume(product.volumeLiters)}` : ""}
      </span>
    </button>
  );
}
