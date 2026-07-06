export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${kg.toLocaleString("en-US", { maximumFractionDigits: 2 })} kg`;
  }
  return `${grams.toLocaleString("en-US")} g`;
}

export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

export function formatVolume(liters: number): string {
  return `${liters.toLocaleString("en-US", { maximumFractionDigits: 1 })} L`;
}
