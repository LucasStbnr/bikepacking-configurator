"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/field";
import { CategoryIcon } from "@/components/products/category-icon";
import { ProductForm } from "@/components/products/product-form";
import type { Product, ProductCategory } from "@/db/schema";
import { formatPrice, formatVolume, formatWeight } from "@/lib/format";
import { allTags, matchesQuery } from "@/lib/tags";
import { cn } from "@/lib/utils";

const FILTERS: { value: ProductCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "bike", label: "Bikes" },
  { value: "wheels", label: "Wheels" },
  { value: "bag", label: "Bags" },
  { value: "accessory", label: "Accessories" },
  { value: "gear", label: "Gear" },
];

export function ProductsView({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<ProductCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const tags = useMemo(() => allTags(products), [products]);

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  const visible = useMemo(
    () =>
      products.filter(
        (p) =>
          (filter === "all" || p.category === filter) &&
          matchesQuery(p, query) &&
          activeTags.every((t) => (p.tags ?? []).includes(t)),
      ),
    [products, filter, query, activeTags],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Gear library</h1>
          <p className="mt-1 text-sm text-muted">
            {products.length} item{products.length === 1 ? "" : "s"} — everything you can put on a bike.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, brand, tag…"
            className="h-9 w-56"
          />
          <Button variant="primary" onClick={() => setCreating(true)}>
            + Add product
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-line">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "-mb-px cursor-pointer border-b-2 px-3 pb-2 pt-1 text-sm transition-colors",
              filter === f.value
                ? "border-accent font-medium text-ink"
                : "border-transparent text-muted hover:text-ink",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {tags.length > 0 ? (
        <div className="-mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const active = activeTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  "cursor-pointer rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors",
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

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line-strong py-16 text-center">
          <span className="font-mono text-2xl text-faint">∅</span>
          <p className="text-sm text-muted">Nothing here yet.</p>
          <Button size="sm" onClick={() => setCreating(true)}>
            Add your first product
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <li key={product.id} className="h-full">
              <button
                type="button"
                onClick={() => setEditing(product)}
                className="group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-lg border border-line bg-surface text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md hover:shadow-ink/5"
              >
                <div className="relative flex h-36 shrink-0 items-center justify-center border-b border-line bg-surface-raised">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-contain p-3"
                    />
                  ) : (
                    <CategoryIcon category={product.category} className="h-20 w-28" />
                  )}
                  <span className="spec-label absolute left-3 top-2.5">{product.category}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                      {product.brand ?? " "}
                    </p>
                    <h2 className="mt-0.5 font-medium leading-snug text-ink group-hover:text-accent-hover">
                      {product.name}
                    </h2>
                    {product.tags && product.tags.length > 0 ? (
                      <ul className="mt-1.5 flex flex-wrap gap-1">
                        {product.tags.map((tag) => (
                          <li
                            key={tag}
                            className="rounded-full border border-line px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted"
                          >
                            {tag}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <dl className="flex flex-col gap-1 text-xs">
                    <div className="spec-row">
                      <dt className="text-muted">Weight</dt>
                      <dd className="font-mono text-ink">
                        {product.weightGrams != null ? formatWeight(product.weightGrams) : "—"}
                      </dd>
                    </div>
                    <div className="spec-row">
                      <dt className="text-muted">Volume</dt>
                      <dd className="font-mono text-ink">
                        {product.volumeLiters != null ? formatVolume(product.volumeLiters) : "—"}
                      </dd>
                    </div>
                    <div className="spec-row">
                      <dt className="text-muted">Price</dt>
                      <dd className="font-mono text-ink">
                        {product.priceCents != null ? formatPrice(product.priceCents) : "—"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Drawer
        open={creating}
        onOpenChange={setCreating}
        title="Add product"
        description="A new entry in your gear library."
      >
        <ProductForm
          suggestions={tags}
          defaultCategory={filter === "all" ? undefined : filter}
          onDone={() => setCreating(false)}
        />
      </Drawer>

      <Drawer
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing?.name ?? ""}
        description={editing?.brand ?? undefined}
      >
        {editing ? (
          <ProductForm
            key={editing.id}
            product={editing}
            suggestions={tags}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Drawer>
    </div>
  );
}
