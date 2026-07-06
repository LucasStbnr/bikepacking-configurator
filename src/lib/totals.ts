import type { SetupDetail } from "@/db/queries";

export type SetupTotals = {
  bikeWeightGrams: number;
  bagsWeightGrams: number;
  gearWeightGrams: number;
  loadedWeightGrams: number;
  totalPriceCents: number;
  totalVolumeLiters: number;
  bagCount: number;
  itemCount: number;
  /** Weight carried per bag (bag + contents), plus unassigned gear. */
  perBag: {
    bagId: number | null;
    label: string;
    weightGrams: number;
  }[];
};

export function computeTotals(detail: SetupDetail): SetupTotals {
  // "bike" weight/price = frame/bike + the selected wheelset
  const bikeWeightGrams =
    (detail.bike?.weightGrams ?? 0) + (detail.wheels?.weightGrams ?? 0);
  const bagsWeightGrams = detail.bags.reduce(
    (sum, b) => sum + (b.product.weightGrams ?? 0),
    0,
  );
  const gearWeightGrams = detail.items.reduce(
    (sum, i) => sum + (i.product.weightGrams ?? 0) * i.quantity,
    0,
  );

  const totalPriceCents =
    (detail.bike?.priceCents ?? 0) +
    (detail.wheels?.priceCents ?? 0) +
    detail.bags.reduce((sum, b) => sum + (b.product.priceCents ?? 0), 0) +
    detail.items.reduce((sum, i) => sum + (i.product.priceCents ?? 0) * i.quantity, 0);

  const totalVolumeLiters = detail.bags.reduce(
    (sum, b) => sum + (b.product.volumeLiters ?? 0),
    0,
  );

  const perBag = detail.bags.map((bag) => ({
    bagId: bag.id as number | null,
    label: bag.product.name,
    weightGrams:
      (bag.product.weightGrams ?? 0) +
      detail.items
        .filter((i) => i.bagId === bag.id)
        .reduce((sum, i) => sum + (i.product.weightGrams ?? 0) * i.quantity, 0),
  }));

  const unassignedWeight = detail.items
    .filter((i) => i.bagId === null)
    .reduce((sum, i) => sum + (i.product.weightGrams ?? 0) * i.quantity, 0);
  if (unassignedWeight > 0) {
    perBag.push({ bagId: null, label: "On bike / on body", weightGrams: unassignedWeight });
  }

  return {
    bikeWeightGrams,
    bagsWeightGrams,
    gearWeightGrams,
    loadedWeightGrams: bikeWeightGrams + bagsWeightGrams + gearWeightGrams,
    totalPriceCents,
    totalVolumeLiters,
    bagCount: detail.bags.length,
    itemCount: detail.items.reduce((sum, i) => sum + i.quantity, 0),
    perBag,
  };
}
