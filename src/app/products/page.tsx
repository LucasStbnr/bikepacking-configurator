import type { Metadata } from "next";
import { getProducts } from "@/db/queries";
import { ProductsView } from "@/components/products/products-view";

export const metadata: Metadata = {
  title: "Gear library",
  description:
    "Every bike, bag and piece of gear in the collection — weights, volumes, prices and mounting options.",
};

// Data lives in SQLite — always render against the live database
export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductsView products={products} />;
}
