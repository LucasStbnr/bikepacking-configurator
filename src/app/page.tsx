import Link from "next/link";
import { createSetup } from "@/actions/setups";
import { BikeDiagram } from "@/components/bike/bike-diagram";
import { getAllSetupDetails } from "@/db/queries";
import { computeTotals } from "@/lib/totals";
import { formatPrice, formatVolume, formatWeight } from "@/lib/format";

// Data lives in SQLite — always render against the live database
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const details = await getAllSetupDetails();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">My setups</h1>
          <p className="mt-1 max-w-md text-sm text-muted">
            Every configuration of bike, bags and gear — weighed, priced and ready to pack.
          </p>
        </div>
        <form action={createSetup}>
          <button
            type="submit"
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-background transition-colors hover:bg-ink/85"
          >
            + New setup
          </button>
        </form>
      </div>

      {details.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-line-strong py-24 text-center">
          <p className="font-display text-lg font-medium">No setups yet</p>
          <p className="max-w-sm text-sm text-muted">
            Create your first setup, pick a bike, hang some bags on it and see what the
            whole rig weighs.
          </p>
          <form action={createSetup}>
            <button
              type="submit"
              className="inline-flex h-9 cursor-pointer items-center rounded-md bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Create a setup
            </button>
          </form>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {details.map((detail) => {
            const totals = computeTotals(detail);
            return (
              <li key={detail.setup.id}>
                <Link
                  href={`/setups/${detail.setup.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface transition-all duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md hover:shadow-ink/5"
                >
                  <div className="border-b border-line bg-surface-raised px-4 pt-2">
                    <BikeDiagram
                      bikeStyle={detail.setup.bikeStyle}
                      color={detail.setup.bikeColor}
                      bags={detail.bags}
                      tireMm={detail.wheels?.tireWidthMm}
                      labels={false}
                      className="h-auto w-full"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div>
                      <h2 className="font-display text-lg font-semibold tracking-tight group-hover:text-accent-hover">
                        {detail.setup.name}
                      </h2>
                      {detail.setup.description ? (
                        <p className="mt-0.5 line-clamp-1 text-sm text-muted">
                          {detail.setup.description}
                        </p>
                      ) : null}
                    </div>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                      <div className="spec-row">
                        <dt className="text-muted">Loaded</dt>
                        <dd className="font-mono font-semibold text-ink">
                          {formatWeight(totals.loadedWeightGrams)}
                        </dd>
                      </div>
                      <div className="spec-row">
                        <dt className="text-muted">Bags</dt>
                        <dd className="font-mono text-ink">{totals.bagCount}</dd>
                      </div>
                      <div className="spec-row">
                        <dt className="text-muted">Storage</dt>
                        <dd className="font-mono text-ink">
                          {formatVolume(totals.totalVolumeLiters)}
                        </dd>
                      </div>
                      <div className="spec-row">
                        <dt className="text-muted">Value</dt>
                        <dd className="font-mono text-ink">
                          {formatPrice(totals.totalPriceCents)}
                        </dd>
                      </div>
                    </dl>
                    {detail.bike ? (
                      <p className="mt-auto font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                        {detail.bike.brand} {detail.bike.name} · {detail.setup.bikeStyle}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
