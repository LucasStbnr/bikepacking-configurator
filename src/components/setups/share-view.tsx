import Link from "next/link";
import { BikeDiagram } from "@/components/bike/bike-diagram";
import { TotalsBar } from "@/components/setups/totals-bar";
import { MOUNT_POINT_LABELS } from "@/db/schema";
import type { ItemWithProduct, SetupDetail } from "@/db/queries";
import type { SetupTotals } from "@/lib/totals";
import { formatVolume, formatWeight } from "@/lib/format";

/** Public, read-only presentation of a setup for the share link. */
export function ShareView({ detail, totals }: { detail: SetupDetail; totals: SetupTotals }) {
  const { setup, bike, wheels, bags, items } = detail;

  const containerBags = bags.filter((b) => b.product.category === "bag");
  const accessories = bags.filter((b) => b.product.category === "accessory");
  const looseItems = items.filter((i) => i.bagId === null);

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="spec-label">Shared setup · {setup.bikeStyle}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            {setup.name}
          </h1>
          {setup.description ? (
            <p className="mt-0.5 text-sm text-muted">{setup.description}</p>
          ) : null}
        </div>
        {bike || wheels ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
            {[
              bike ? [bike.brand, bike.name].filter(Boolean).join(" ") : null,
              wheels?.name,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
      </div>

      {/* Diagram */}
      <div className="rounded-lg border border-line bg-surface p-2">
        <BikeDiagram
          bikeStyle={setup.bikeStyle}
          color={setup.bikeColor}
          bags={bags}
          tireMm={wheels?.tireWidthMm}
          className="h-auto w-full"
        />
      </div>

      {/* Packing list */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {containerBags.map((bag) => {
          const bagItems = items.filter((i) => i.bagId === bag.id);
          return (
            <section key={bag.id}>
              <header className="mb-2 flex items-baseline gap-2">
                <h2 className="font-display text-[15px] font-medium">{bag.product.name}</h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                  {MOUNT_POINT_LABELS[bag.mountPoint]}
                  {bag.product.volumeLiters != null
                    ? ` · ${formatVolume(bag.product.volumeLiters)}`
                    : ""}
                </span>
              </header>
              <ul className="overflow-hidden rounded-lg border border-line bg-surface">
                {bagItems.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-faint">Empty</li>
                ) : (
                  bagItems.map((item) => <GearRow key={item.id} item={item} />)
                )}
              </ul>
            </section>
          );
        })}

        {looseItems.length > 0 ? (
          <section>
            <header className="mb-2 flex items-baseline gap-2">
              <h2 className="font-display text-[15px] font-medium">On bike / on body</h2>
            </header>
            <ul className="overflow-hidden rounded-lg border border-line bg-surface">
              {looseItems.map((item) => (
                <GearRow key={item.id} item={item} />
              ))}
            </ul>
          </section>
        ) : null}

        {accessories.length > 0 ? (
          <section>
            <header className="mb-2 flex items-baseline gap-2">
              <h2 className="font-display text-[15px] font-medium">Accessories</h2>
            </header>
            <ul className="overflow-hidden rounded-lg border border-line bg-surface">
              {accessories.map((acc) => (
                <li
                  key={acc.id}
                  className="flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0"
                >
                  <span className="min-w-0 flex-1 truncate text-[15px]">
                    {acc.product.name}
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                      {MOUNT_POINT_LABELS[acc.mountPoint]}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted">
                    {acc.product.weightGrams != null ? formatWeight(acc.product.weightGrams) : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {bags.length === 0 && items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong py-14 text-center">
          <p className="text-sm text-muted">Nothing packed on this setup yet.</p>
        </div>
      ) : null}

      <p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        Read-only share ·{" "}
        <Link href="/" className="text-muted underline transition-colors hover:text-accent">
          built with Packrig
        </Link>
      </p>

      <TotalsBar totals={totals} />
    </div>
  );
}

function GearRow({ item }: { item: ItemWithProduct }) {
  return (
    <li className="flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
      <span className="min-w-0 flex-1 truncate text-[15px]">
        {item.product.name}
        {item.quantity > 1 ? (
          <span className="ml-1.5 font-mono text-xs text-accent-hover">×{item.quantity}</span>
        ) : null}
      </span>
      <span className="shrink-0 font-mono text-xs text-muted">
        {item.product.weightGrams != null
          ? formatWeight(item.product.weightGrams * item.quantity)
          : ""}
      </span>
    </li>
  );
}
