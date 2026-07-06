import type { Metadata } from "next";
import { getAllSetupDetails } from "@/db/queries";
import { computeTotals } from "@/lib/totals";
import { CompareView } from "@/components/setups/compare-view";

export const metadata: Metadata = {
  title: "Compare setups",
  description: "Put two or three bikepacking setups side by side — weight, storage, price and gear differences.",
};

// Data lives in SQLite — always render against the live database
export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const details = await getAllSetupDetails();
  const entries = details.map((detail) => ({ detail, totals: computeTotals(detail) }));
  return <CompareView entries={entries} />;
}
