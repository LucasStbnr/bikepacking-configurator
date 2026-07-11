import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSetupDetailByShareToken } from "@/db/queries";
import { computeTotals } from "@/lib/totals";
import { ShareView } from "@/components/setups/share-view";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const detail = await getSetupDetailByShareToken(token);
  if (!detail) return { title: "Setup not found", robots: { index: false } };
  const totals = computeTotals(detail);
  return {
    title: detail.setup.name,
    description: `${detail.setup.name} — ${(totals.loadedWeightGrams / 1000).toFixed(1)} kg loaded, ${totals.bagCount} bags, ${totals.totalVolumeLiters} L of storage.`,
    // Share pages are reachable only via an unguessable link — keep them out of search
    robots: { index: false, follow: false },
  };
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;
  const detail = await getSetupDetailByShareToken(token);
  if (!detail) notFound();

  return <ShareView detail={detail} totals={computeTotals(detail)} />;
}
