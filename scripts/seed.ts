import { db, products, setupBags, setupItems, setups } from "../src/db/index.ts";

const existing = db.select({ id: products.id }).from(products).limit(1).all();
if (existing.length > 0) {
  console.log("Database already contains products — skipping seed.");
  process.exit(0);
}

const [bike] = db
  .insert(products)
  .values({
    name: "Grail CF SL 7",
    brand: "Canyon",
    category: "bike",
    weightGrams: 8600,
    priceCents: 299900,
    size: "M",
    url: "https://www.canyon.com/en-fr/gravel-bikes/all-road/grail/",
    notes: "Gravel bike, 40mm tyres",
  })
  .returning()
  .all();

const wheelsets = db
  .insert(products)
  .values([
    {
      name: "Gravel wheelset — 700x35",
      brand: "DT Swiss",
      category: "wheels",
      weightGrams: 1650,
      priceCents: 80000,
      tireWidthMm: 35,
    },
    {
      name: "Road wheelset — 700x28",
      brand: "Zipp",
      category: "wheels",
      weightGrams: 1450,
      priceCents: 120000,
      tireWidthMm: 28,
    },
  ])
  .returning()
  .all();

const bags = db
  .insert(products)
  .values([
    {
      name: "Handlebar Pack 11L",
      brand: "Ortlieb",
      category: "bag",
      weightGrams: 417,
      priceCents: 9500,
      volumeLiters: 11,
      dimensions: "58 × 18 × 16 cm",
      mountPoints: ["handlebar"],
    },
    {
      name: "Seat-Pack 16.5L",
      brand: "Ortlieb",
      category: "bag",
      weightGrams: 456,
      priceCents: 11000,
      volumeLiters: 16.5,
      dimensions: "62 × 26 × 20 cm",
      mountPoints: ["saddle"],
    },
    {
      name: "Frame-Pack Toptube 4L",
      brand: "Ortlieb",
      category: "bag",
      weightGrams: 227,
      priceCents: 9000,
      volumeLiters: 4,
      dimensions: "50 × 10 × 6 cm",
      mountPoints: ["frame"],
    },
    {
      name: "Top Tube Bag 1L",
      brand: "Restrap",
      category: "bag",
      weightGrams: 130,
      priceCents: 3500,
      volumeLiters: 1,
      mountPoints: ["toptube", "stem"],
    },
    {
      name: "Cargo Cage + Dry Bag 8L",
      brand: "Salsa",
      category: "bag",
      weightGrams: 340,
      priceCents: 6500,
      volumeLiters: 8,
      mountPoints: ["fork_left", "fork_right"],
    },
  ])
  .returning()
  .all();

const gear = db
  .insert(products)
  .values([
    { name: "Fly Creek HV UL2 tent", brand: "Big Agnes", category: "gear", weightGrams: 1100, priceCents: 44900 },
    { name: "Spark SP II sleeping bag", brand: "Sea to Summit", category: "gear", weightGrams: 505, priceCents: 38000 },
    { name: "NeoAir XLite mattress", brand: "Therm-a-Rest", category: "gear", weightGrams: 350, priceCents: 19900 },
    { name: "PocketRocket 2 stove", brand: "MSR", category: "gear", weightGrams: 73, priceCents: 4500 },
    { name: "Titanium pot 750ml", brand: "Toaks", category: "gear", weightGrams: 103, priceCents: 3200 },
    { name: "Rain jacket", brand: "Patagonia", category: "gear", weightGrams: 235, priceCents: 22000 },
    { name: "Down jacket", brand: "Decathlon", category: "gear", weightGrams: 380, priceCents: 8900 },
    { name: "Repair kit + multitool", brand: "Crankbrothers", category: "gear", weightGrams: 168, priceCents: 3900 },
    { name: "Charge 100 power bank", brand: "Nitecore", category: "gear", weightGrams: 160, priceCents: 6900 },
    { name: "Headlamp", brand: "Petzl", category: "gear", weightGrams: 88, priceCents: 3500 },
  ])
  .returning()
  .all();

const [setup] = db
  .insert(setups)
  .values({
    name: "3-day summer escape",
    description: "Light setup for a long weekend on gravel roads.",
    bikeProductId: bike.id,
    wheelProductId: wheelsets[0].id,
    bikeStyle: "gravel",
    bikeColor: "#3d6ba3",
  })
  .returning()
  .all();

const byName = (name: string) => {
  const p = [...bags, ...gear].find((x) => x.name === name);
  if (!p) throw new Error(`Seed product not found: ${name}`);
  return p;
};

const mountedBags = db
  .insert(setupBags)
  .values([
    { setupId: setup.id, productId: byName("Handlebar Pack 11L").id, mountPoint: "handlebar" },
    { setupId: setup.id, productId: byName("Seat-Pack 16.5L").id, mountPoint: "saddle" },
    { setupId: setup.id, productId: byName("Frame-Pack Toptube 4L").id, mountPoint: "frame" },
    { setupId: setup.id, productId: byName("Top Tube Bag 1L").id, mountPoint: "toptube" },
  ])
  .returning()
  .all();

const bagAt = (mountPoint: string) => {
  const b = mountedBags.find((x) => x.mountPoint === mountPoint);
  if (!b) throw new Error(`Seed bag not found at: ${mountPoint}`);
  return b;
};

db.insert(setupItems)
  .values([
    { setupId: setup.id, productId: byName("Fly Creek HV UL2 tent").id, bagId: bagAt("handlebar").id },
    { setupId: setup.id, productId: byName("Spark SP II sleeping bag").id, bagId: bagAt("saddle").id },
    { setupId: setup.id, productId: byName("NeoAir XLite mattress").id, bagId: bagAt("saddle").id },
    { setupId: setup.id, productId: byName("Down jacket").id, bagId: bagAt("saddle").id },
    { setupId: setup.id, productId: byName("Rain jacket").id, bagId: bagAt("handlebar").id },
    { setupId: setup.id, productId: byName("PocketRocket 2 stove").id, bagId: bagAt("frame").id },
    { setupId: setup.id, productId: byName("Titanium pot 750ml").id, bagId: bagAt("frame").id },
    { setupId: setup.id, productId: byName("Repair kit + multitool").id, bagId: bagAt("frame").id },
    { setupId: setup.id, productId: byName("Charge 100 power bank").id, bagId: bagAt("toptube").id },
    { setupId: setup.id, productId: byName("Headlamp").id, bagId: bagAt("toptube").id },
  ])
  .run();

console.log(
  `Seeded ${1 + wheelsets.length + bags.length + gear.length} products and 1 demo setup.`,
);
