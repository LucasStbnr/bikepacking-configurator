import type { Product } from "@/db/schema";

/** Unique, alphabetically sorted union of every product's tags. */
export function allTags(products: Product[]): string[] {
  const set = new Set<string>();
  for (const product of products) {
    for (const tag of product.tags ?? []) set.add(tag);
  }
  return Array.from(set).sort();
}

/**
 * Case-insensitive substring match over a product's name, brand and tags.
 * An empty/whitespace query matches everything.
 */
export function matchesQuery(product: Product, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (product.name.toLowerCase().includes(q)) return true;
  if ((product.brand ?? "").toLowerCase().includes(q)) return true;
  return (product.tags ?? []).some((tag) => tag.toLowerCase().includes(q));
}
