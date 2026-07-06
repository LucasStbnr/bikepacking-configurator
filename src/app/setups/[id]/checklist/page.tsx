import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSetupDetail } from "@/db/queries";
import { ChecklistView } from "@/components/setups/checklist-view";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const detail = await getSetupDetail(Number(id));
  return {
    title: detail ? `Checklist — ${detail.setup.name}` : "Checklist",
    description: detail
      ? `Pre-departure packing checklist for ${detail.setup.name}.`
      : undefined,
  };
}

export default async function ChecklistPage({ params }: Props) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const detail = await getSetupDetail(numericId);
  if (!detail) notFound();

  return <ChecklistView detail={detail} />;
}
