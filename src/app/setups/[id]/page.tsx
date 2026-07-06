import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProducts, getSetupDetail } from "@/db/queries";
import { computeTotals } from "@/lib/totals";
import { ConfiguratorView } from "@/components/setups/configurator-view";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const detail = await getSetupDetail(Number(id));
  if (!detail) return { title: "Setup not found" };
  const totals = computeTotals(detail);
  return {
    title: detail.setup.name,
    description: `${detail.setup.name} — ${(totals.loadedWeightGrams / 1000).toFixed(1)} kg loaded, ${totals.bagCount} bags, ${totals.totalVolumeLiters} L of storage.`,
  };
}

export default async function SetupPage({ params }: Props) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const [detail, products] = await Promise.all([getSetupDetail(numericId), getProducts()]);
  if (!detail) notFound();

  return (
    <ConfiguratorView detail={detail} products={products} totals={computeTotals(detail)} />
  );
}
