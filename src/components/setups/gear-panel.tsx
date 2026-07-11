"use client";

import { useMemo, useState, useTransition } from "react";
import { addItem, mountBag, removeItem, setItemQuantity, unmountBag } from "@/actions/setups";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/field";
import { MOUNT_POINT_LABELS, type Product } from "@/db/schema";
import type { BagWithProduct, ItemWithProduct } from "@/db/queries";
import { track } from "@/lib/analytics";
import { formatVolume, formatWeight } from "@/lib/format";
import { allTags, matchesQuery } from "@/lib/tags";
import { cn } from "@/lib/utils";

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
  const bagProducts = useMemo(
    () => products.filter((p) => p.category === "bag"),
    [products],
  );
  const [, startTransition] = useTransition();

  // Only bags act as containers you pack gear into. Mounted accessories
  // (GPS, lights, bottles…) are tracked on the diagram + totals but are not
  // containers, so they get a compact read-only summary instead of a section.
  const bagSections = bags.filter((b) => b.product.category === "bag");
  const mountedAccessories = bags.filter((b) => b.product.category === "accessory");

  const sections: {
    bagId: number | null;
    title: string;
    subtitle?: string;
    /** Worn bags have no diagram popover, so they get a remove button here. */
    removable?: boolean;
  }[] = [
    ...bagSections.map((b) => ({
      bagId: b.id as number | null,
      title: b.product.name,
      subtitle: MOUNT_POINT_LABELS[b.mountPoint],
      removable: b.mountPoint === "cyclist",
    })),
    { bagId: null, title: "On bike / on body", subtitle: "bottles, GPS, worn kit…" },
  ];

  function removeWornBag(bagId: number) {
    startTransition(() => unmountBag(setupId, bagId));
    track("bag_removed", { mount_point: "cyclist" });
  }

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
              {section.removable && section.bagId != null ? (
                <button
                  type="button"
                  aria-label={`Remove ${section.title}`}
                  onClick={() => removeWornBag(section.bagId as number)}
                  className="flex size-5 shrink-0 cursor-pointer items-center justify-center self-center rounded text-faint transition-colors hover:bg-danger/10 hover:text-danger"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                    <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </button>
              ) : null}
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
              {section.bagId === null ? (
                <li>
                  <AddBagButton setupId={setupId} bagProducts={bagProducts} />
                </li>
              ) : null}
            </ul>
          </section>
        );
      })}

      {mountedAccessories.length > 0 ? (
        <section className="rounded-lg border border-line bg-surface">
          <header className="flex items-baseline justify-between gap-2 border-b border-line px-3 py-2">
            <h3 className="spec-label !text-[10px]">Accessories</h3>
            <span className="shrink-0 font-mono text-[11px] text-muted">
              {formatWeight(
                mountedAccessories.reduce(
                  (sum, a) => sum + (a.product.weightGrams ?? 0),
                  0,
                ),
              )}
            </span>
          </header>
          <ul className="flex flex-col px-1 py-1">
            {mountedAccessories.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-2 rounded-md px-2 py-1"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] leading-tight">
                    {a.product.name}
                  </span>
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-faint">
                    {MOUNT_POINT_LABELS[a.mountPoint]}
                  </span>
                </span>
                <span className="w-14 shrink-0 text-right font-mono text-[11px] text-muted">
                  {a.product.weightGrams != null
                    ? formatWeight(a.product.weightGrams)
                    : "—"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [, startTransition] = useTransition();

  const tags = useMemo(() => allTags(gearProducts), [gearProducts]);

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  const filtered = gearProducts.filter(
    (p) => matchesQuery(p, query) && activeTags.every((t) => (p.tags ?? []).includes(t)),
  );

  function pick(product: Product) {
    setOpen(false);
    setQuery("");
    setActiveTags([]);
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
        {tags.length > 0 ? (
          <div className="mb-1.5 flex max-h-16 flex-wrap gap-1 overflow-y-auto">
            {tags.map((tag) => {
              const active = activeTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "cursor-pointer rounded-full border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] transition-colors",
                    active
                      ? "border-accent bg-accent/10 text-accent-hover"
                      : "border-line text-muted hover:border-line-strong hover:text-ink",
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        ) : null}
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

/** Mounts a bag to the "cyclist" zone — a backpack, hip pack… worn by the rider. */
function AddBagButton({
  setupId,
  bagProducts,
}: {
  setupId: number;
  bagProducts: Product[];
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const compatible = bagProducts.filter((p) => p.mountPoints?.includes("cyclist"));
  const others = bagProducts.filter((p) => !p.mountPoints?.includes("cyclist"));

  function pick(product: Product) {
    setOpen(false);
    startTransition(() => mountBag(setupId, product.id, "cyclist"));
    track("bag_mounted", { mount_point: "cyclist", product: product.name });
  }

  const row = (p: Product, dim?: boolean) => (
    <button
      key={p.id}
      type="button"
      onClick={() => pick(p)}
      className={cn(
        "flex w-full cursor-pointer items-baseline justify-between gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-line/50",
        dim && "opacity-60",
      )}
    >
      <span className="min-w-0">
        <span className="block truncate text-[13px]">{p.name}</span>
        {p.brand ? (
          <span className="font-mono text-[10px] uppercase tracking-wide text-faint">
            {p.brand}
          </span>
        ) : null}
      </span>
      <span className="shrink-0 font-mono text-[10.5px] text-muted">
        {p.weightGrams != null ? formatWeight(p.weightGrams) : ""}
        {p.volumeLiters != null ? ` · ${formatVolume(p.volumeLiters)}` : ""}
      </span>
    </button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] text-faint transition-colors hover:bg-line/40 hover:text-muted"
        >
          <span className="font-mono">+</span> Add worn bag
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <p className="spec-label px-2 pb-1.5 pt-1">{MOUNT_POINT_LABELS.cyclist}</p>
        <div className="max-h-56 overflow-y-auto">
          {bagProducts.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted">No bags in the library yet.</p>
          ) : null}
          {compatible.map((p) => row(p))}
          {others.length > 0 ? (
            <>
              <p className="spec-label px-2 pb-1 pt-2 !text-[9px]">
                Not marked for this spot
              </p>
              {others.map((p) => row(p, true))}
            </>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
