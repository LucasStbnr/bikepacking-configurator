"use client";

import { useMemo, useState, useTransition } from "react";
import { addItem, removeItem, setItemQuantity } from "@/actions/setups";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/field";
import { MOUNT_POINT_LABELS, type Product } from "@/db/schema";
import type { BagWithProduct, ItemWithProduct } from "@/db/queries";
import { track } from "@/lib/analytics";
import { formatWeight } from "@/lib/format";

export function GearPanel({
  setupId,
  bags,
  items,
  products,
}: {
  setupId: number;
  bags: BagWithProduct[];
  items: ItemWithProduct[];
  products: Product[];
}) {
  const gearProducts = useMemo(
    () => products.filter((p) => p.category === "gear" || p.category === "accessory"),
    [products],
  );

  const sections: { bagId: number | null; title: string; subtitle?: string }[] = [
    ...bags.map((b) => ({
      bagId: b.id as number | null,
      title: b.product.name,
      subtitle: MOUNT_POINT_LABELS[b.mountPoint],
    })),
    { bagId: null, title: "On bike / on body", subtitle: "bottles, GPS, worn kit…" },
  ];

  return (
    <aside className="flex flex-col gap-3">
      <h2 className="spec-label">Packing list</h2>
      {sections.map((section) => {
        const sectionItems = items.filter((i) => i.bagId === section.bagId);
        const weight = sectionItems.reduce(
          (sum, i) => sum + (i.product.weightGrams ?? 0) * i.quantity,
          0,
        );
        return (
          <section
            key={section.bagId ?? "loose"}
            className="rounded-lg border border-line bg-surface"
          >
            <header className="flex items-baseline justify-between gap-2 border-b border-line px-3 py-2">
              <div className="min-w-0">
                <h3 className="truncate text-[13px] font-medium leading-tight">
                  {section.title}
                </h3>
                {section.subtitle ? (
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-faint">
                    {section.subtitle}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 font-mono text-[11px] text-muted">
                {weight > 0 ? formatWeight(weight) : "empty"}
              </span>
            </header>

            <ul className="flex flex-col px-1 py-1">
              {sectionItems.map((item) => (
                <ItemRow key={item.id} setupId={setupId} item={item} />
              ))}
              <li>
                <AddGearButton
                  setupId={setupId}
                  bagId={section.bagId}
                  gearProducts={gearProducts}
                />
              </li>
            </ul>
          </section>
        );
      })}
      {bags.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong px-3 py-4 text-center text-xs text-muted">
          Mount bags on the bike to start packing.
        </p>
      ) : null}
    </aside>
  );
}

function ItemRow({ setupId, item }: { setupId: number; item: ItemWithProduct }) {
  const [pending, startTransition] = useTransition();
  return (
    <li className="group flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-line/40">
      <span className="min-w-0 flex-1 truncate text-[13px]">{item.product.name}</span>
      <span className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <QtyButton
          label="Decrease quantity"
          disabled={pending || item.quantity <= 1}
          onClick={() =>
            startTransition(() => setItemQuantity(setupId, item.id, item.quantity - 1))
          }
        >
          −
        </QtyButton>
        <QtyButton
          label="Increase quantity"
          disabled={pending}
          onClick={() =>
            startTransition(() => setItemQuantity(setupId, item.id, item.quantity + 1))
          }
        >
          +
        </QtyButton>
      </span>
      {item.quantity > 1 ? (
        <span className="font-mono text-[11px] text-accent-hover">×{item.quantity}</span>
      ) : null}
      <span className="w-14 text-right font-mono text-[11px] text-muted">
        {item.product.weightGrams != null
          ? formatWeight(item.product.weightGrams * item.quantity)
          : "—"}
      </span>
      <button
        type="button"
        aria-label={`Remove ${item.product.name}`}
        disabled={pending}
        onClick={() => {
          startTransition(() => removeItem(setupId, item.id));
          track("item_removed");
        }}
        className="flex size-5 cursor-pointer items-center justify-center rounded text-faint opacity-0 transition-all hover:bg-danger/10 hover:text-danger group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </li>
  );
}

function QtyButton({
  label,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-5 cursor-pointer items-center justify-center rounded border border-line-strong bg-surface font-mono text-[11px] text-muted transition-colors hover:border-ink/40 hover:text-ink disabled:opacity-40"
      {...props}
    >
      {children}
    </button>
  );
}

function AddGearButton({
  setupId,
  bagId,
  gearProducts,
}: {
  setupId: number;
  bagId: number | null;
  gearProducts: Product[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  const filtered = gearProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.brand ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  function pick(product: Product) {
    setOpen(false);
    setQuery("");
    startTransition(() => addItem(setupId, product.id, bagId));
    track("item_added", { product: product.name });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] text-faint transition-colors hover:bg-line/40 hover:text-muted"
        >
          <span className="font-mono">+</span> Add gear
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search gear…"
          className="mb-1.5 h-8 text-[13px]"
        />
        <div className="max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted">No matching gear in the library.</p>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pick(p)}
                className="flex w-full cursor-pointer items-baseline justify-between gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-line/50"
              >
                <span className="min-w-0 truncate text-[13px]">{p.name}</span>
                <span className="shrink-0 font-mono text-[10.5px] text-muted">
                  {p.weightGrams != null ? formatWeight(p.weightGrams) : ""}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
