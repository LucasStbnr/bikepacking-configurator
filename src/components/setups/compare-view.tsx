"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BikeDiagram } from "@/components/bike/bike-diagram";
import type { SetupDetail } from "@/db/queries";
import type { SetupTotals } from "@/lib/totals";
import { track } from "@/lib/analytics";
import { formatPrice, formatVolume, formatWeight } from "@/lib/format";
import { cn } from "@/lib/utils";

type Entry = { detail: SetupDetail; totals: SetupTotals };

export function CompareView({ entries }: { entries: Entry[] }) {
  const [selected, setSelected] = useState<number[]>(() =>
    entries.slice(0, Math.min(entries.length, 2)).map((e) => e.detail.setup.id),
  );

  const picked = entries.filter((e) => selected.includes(e.detail.setup.id));

  function toggle(id: number) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      track("compare_used", { count: prev.length + 1 });
      return [...prev, id];
    });
  }

  // Gear that is not present in every selected setup
  const uniqueGear = useMemo(() => {
    if (picked.length < 2) return new Map<number, string[]>();
    const productSets = picked.map(
      (e) => new Set(e.detail.items.map((i) => i.productId)),
    );
    const map = new Map<number, string[]>();
    picked.forEach((e, idx) => {
      const others = productSets.filter((_, i) => i !== idx);
      const unique = e.detail.items
        .filter((i) => !others.every((s) => s.has(i.productId)))
        .map((i) => i.product.name);
      map.set(e.detail.setup.id, [...new Set(unique)]);
    });
    return map;
  }, [picked]);

  const best = useMemo(() => {
    if (picked.length < 2) return { weight: null as number | null, price: null as number | null };
    return {
      weight: Math.min(...picked.map((e) => e.totals.loadedWeightGrams)),
      price: Math.min(...picked.map((e) => e.totals.totalPriceCents)),
    };
  }, [picked]);

  if (entries.length < 2) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line-strong py-24 text-center">
        <p className="font-display text-lg font-medium">Not enough setups to compare</p>
        <p className="max-w-sm text-sm text-muted">
          You need at least two setups. Build another one and come back.
        </p>
        <Link href="/" className="text-sm text-accent underline">
          Back to setups
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Compare setups</h1>
        <p className="mt-1 text-sm text-muted">Pick two or three configurations.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {entries.map(({ detail }) => {
          const active = selected.includes(detail.setup.id);
          return (
            <button
              key={detail.setup.id}
              type="button"
              onClick={() => toggle(detail.setup.id)}
              className={cn(
                "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                active
                  ? "border-ink bg-ink text-background"
                  : "border-line-strong bg-surface text-muted hover:border-ink/40 hover:text-ink",
              )}
            >
              {detail.setup.name}
            </button>
          );
        })}
      </div>

      {picked.length < 2 ? (
        <p className="rounded-lg border border-dashed border-line-strong px-4 py-10 text-center text-sm text-muted">
          Select at least two setups above.
        </p>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${picked.length}, minmax(0, 1fr))` }}
        >
          {picked.map(({ detail, totals }) => {
            const bestWeight = totals.loadedWeightGrams === best.weight;
            const bestPrice = totals.totalPriceCents === best.price;
            return (
              <article
                key={detail.setup.id}
                className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface"
              >
                <div className="border-b border-line bg-surface-raised px-3 pt-1">
                  <BikeDiagram
                    bikeStyle={detail.setup.bikeStyle}
                    color={detail.setup.bikeColor}
                    bags={detail.bags}
                    tireMm={detail.wheels?.tireWidthMm}
                    labels={false}
                    className="h-auto w-full"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-4 p-4">
                  <div>
                    <Link
                      href={`/setups/${detail.setup.id}`}
                      className="font-display text-base font-semibold tracking-tight hover:text-accent-hover"
                    >
                      {detail.setup.name}
                    </Link>
                    {detail.bike ? (
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                        {detail.bike.brand} {detail.bike.name}
                      </p>
                    ) : null}
                  </div>

                  <dl className="flex flex-col gap-1.5 text-xs">
                    <CompareRow
                      label="Loaded weight"
                      value={formatWeight(totals.loadedWeightGrams)}
                      highlight={bestWeight}
                    />
                    <CompareRow label="Bike" value={formatWeight(totals.bikeWeightGrams)} />
                    {detail.wheels ? (
                      <CompareRow
                        label="Wheels"
                        value={
                          detail.wheels.tireWidthMm
                            ? `${detail.wheels.tireWidthMm}mm`
                            : detail.wheels.name
                        }
                      />
                    ) : null}
                    <CompareRow
                      label="Carried"
                      value={formatWeight(totals.bagsWeightGrams + totals.gearWeightGrams)}
                    />
                    <CompareRow label="Storage" value={formatVolume(totals.totalVolumeLiters)} />
                    <CompareRow
                      label="Value"
                      value={formatPrice(totals.totalPriceCents)}
                      highlight={bestPrice}
                    />
                    <CompareRow label="Bags" value={String(totals.bagCount)} />
                    <CompareRow label="Items" value={String(totals.itemCount)} />
                  </dl>

                  <div className="border-t border-line pt-3">
                    <p className="spec-label mb-1.5 !text-[9px]">Bags</p>
                    <ul className="flex flex-col gap-1 text-xs text-ink-secondary">
                      {detail.bags.length === 0 ? (
                        <li className="text-faint">—</li>
                      ) : (
                        detail.bags.map((b) => <li key={b.id}>{b.product.name}</li>)
                      )}
                    </ul>
                  </div>

                  {(uniqueGear.get(detail.setup.id)?.length ?? 0) > 0 ? (
                    <div className="border-t border-line pt-3">
                      <p className="spec-label mb-1.5 !text-[9px] text-accent-hover">
                        Only here
                      </p>
                      <ul className="flex flex-col gap-1 text-xs text-ink-secondary">
                        {uniqueGear.get(detail.setup.id)!.map((name) => (
                          <li key={name}>{name}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CompareRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="spec-row">
      <dt className="text-muted">{label}</dt>
      <dd className={cn("font-mono", highlight ? "font-semibold text-success" : "text-ink")}>
        {value}
        {highlight ? " ●" : ""}
      </dd>
    </div>
  );
}
