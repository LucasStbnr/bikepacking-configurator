"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { resetChecklist, setBagChecked, setItemChecked } from "@/actions/checklist";
import { Button } from "@/components/ui/button";
import { MOUNT_POINT_LABELS } from "@/db/schema";
import type { BagWithProduct, ItemWithProduct, SetupDetail } from "@/db/queries";
import { track } from "@/lib/analytics";
import { formatWeight } from "@/lib/format";
import { cn } from "@/lib/utils";

type Patch =
  | { kind: "item"; id: number; checked: boolean }
  | { kind: "bag"; id: number; checked: boolean }
  | { kind: "all"; checked: boolean };

export function ChecklistView({ detail }: { detail: SetupDetail }) {
  const { setup, bags, items } = detail;
  const [, startTransition] = useTransition();

  const [optimistic, applyOptimistic] = useOptimistic(
    { bags, items },
    (state, patch: Patch) => ({
      bags: state.bags.map((b) =>
        patch.kind === "all" || (patch.kind === "bag" && b.id === patch.id)
          ? { ...b, checked: patch.checked }
          : b,
      ),
      items: state.items.map((i) =>
        patch.kind === "all" || (patch.kind === "item" && i.id === patch.id)
          ? { ...i, checked: patch.checked }
          : i,
      ),
    }),
  );

  const containerBags = optimistic.bags.filter((b) => b.product.category === "bag");
  const accessories = optimistic.bags.filter((b) => b.product.category === "accessory");

  // Progress spans everything you have to bring: bags, their contents,
  // loose gear, and mounted accessories.
  const checkables = [...optimistic.bags, ...optimistic.items];
  const total = checkables.length;
  const done = checkables.filter((c) => c.checked).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  function toggleItem(item: ItemWithProduct) {
    const checked = !item.checked;
    startTransition(async () => {
      applyOptimistic({ kind: "item", id: item.id, checked });
      await setItemChecked(setup.id, item.id, checked);
      if (checked && done + 1 === total) track("checklist_completed", { setup: setup.name });
    });
  }

  function toggleBag(bag: BagWithProduct) {
    const checked = !bag.checked;
    startTransition(async () => {
      applyOptimistic({ kind: "bag", id: bag.id, checked });
      await setBagChecked(setup.id, bag.id, checked);
      if (checked && done + 1 === total) track("checklist_completed", { setup: setup.name });
    });
  }

  function reset() {
    startTransition(async () => {
      applyOptimistic({ kind: "all", checked: false });
      await resetChecklist(setup.id);
      track("checklist_reset");
    });
  }

  const looseItems = optimistic.items.filter((i) => i.bagId === null);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/setups/${setup.id}`}
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-accent"
          >
            ← {setup.name}
          </Link>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            Packing checklist
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          disabled={done === 0}
          title="Uncheck everything and start over"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M2.5 7a4.5 4.5 0 1 1 1.32 3.18M2.5 7V3.8M2.5 7h3.2"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Reset checklist
        </Button>
      </div>

      {/* Progress */}
      <div className="rounded-lg border border-line bg-surface px-4 py-3">
        <div className="flex items-baseline justify-between">
          <span className="spec-label">Progress</span>
          <span className="font-mono text-sm">
            <span className={cn("font-semibold", pct === 100 ? "text-success" : "text-accent-hover")}>
              {done}
            </span>
            <span className="text-muted"> / {total} packed</span>
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-line/70">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              pct === 100 ? "bg-success" : "bg-accent",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        {pct === 100 && total > 0 ? (
          <p className="mt-2 text-sm font-medium text-success">
            All packed — have a great ride! 🚲
          </p>
        ) : null}
      </div>

      {/* One section per bag: the bag itself is checkable, plus its contents */}
      {containerBags.map((bag) => {
        const bagItems = optimistic.items.filter((i) => i.bagId === bag.id);
        return (
          <section key={`bag-${bag.id}`}>
            <header className="mb-2 flex items-baseline gap-2">
              <h2 className="font-display text-[15px] font-medium">{bag.product.name}</h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                {MOUNT_POINT_LABELS[bag.mountPoint]}
              </span>
            </header>
            <ul className="overflow-hidden rounded-lg border border-line bg-surface">
              <CheckRow
                checked={bag.checked}
                onToggle={() => toggleBag(bag)}
                name={bag.product.name}
                note="the bag"
                weightGrams={bag.product.weightGrams}
              />
              {bagItems.map((item) => (
                <CheckRow
                  key={item.id}
                  checked={item.checked}
                  onToggle={() => toggleItem(item)}
                  name={item.product.name}
                  quantity={item.quantity}
                  weightGrams={item.product.weightGrams}
                />
              ))}
            </ul>
          </section>
        );
      })}

      {/* Loose gear not stored in a bag */}
      {looseItems.length > 0 ? (
        <section>
          <header className="mb-2 flex items-baseline gap-2">
            <h2 className="font-display text-[15px] font-medium">On bike / on body</h2>
          </header>
          <ul className="overflow-hidden rounded-lg border border-line bg-surface">
            {looseItems.map((item) => (
              <CheckRow
                key={item.id}
                checked={item.checked}
                onToggle={() => toggleItem(item)}
                name={item.product.name}
                quantity={item.quantity}
                weightGrams={item.product.weightGrams}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {/* Mounted accessories (GPS, lights, radar…) */}
      {accessories.length > 0 ? (
        <section>
          <header className="mb-2 flex items-baseline gap-2">
            <h2 className="font-display text-[15px] font-medium">Accessories</h2>
          </header>
          <ul className="overflow-hidden rounded-lg border border-line bg-surface">
            {accessories.map((acc) => (
              <CheckRow
                key={`acc-${acc.id}`}
                checked={acc.checked}
                onToggle={() => toggleBag(acc)}
                name={acc.product.name}
                note={MOUNT_POINT_LABELS[acc.mountPoint]}
                weightGrams={acc.product.weightGrams}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {total === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line-strong py-14 text-center">
          <p className="text-sm text-muted">Nothing to pack yet.</p>
          <Link href={`/setups/${setup.id}`} className="text-sm text-accent underline">
            Add gear in the configurator
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function CheckRow({
  checked,
  onToggle,
  name,
  note,
  quantity = 1,
  weightGrams,
}: {
  checked: boolean;
  onToggle: () => void;
  name: string;
  note?: string;
  quantity?: number;
  weightGrams: number | null;
}) {
  return (
    <li className="border-t border-line first:border-t-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-line/30"
      >
        <span
          aria-hidden
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded border transition-all",
            checked ? "border-success bg-success text-white" : "border-line-strong bg-surface",
          )}
        >
          {checked ? (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2 6.5l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-[15px] transition-all",
            checked && "text-faint line-through",
          )}
        >
          {name}
          {quantity > 1 ? (
            <span className="ml-1.5 font-mono text-xs text-accent-hover">×{quantity}</span>
          ) : null}
          {note ? (
            <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
              {note}
            </span>
          ) : null}
        </span>
        <span className="shrink-0 font-mono text-xs text-muted">
          {weightGrams != null ? formatWeight(weightGrams * quantity) : ""}
        </span>
      </button>
    </li>
  );
}
