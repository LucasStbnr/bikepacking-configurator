import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  products,
  setupBags,
  setupItems,
  setups,
  type Product,
  type Setup,
  type SetupBag,
  type SetupItem,
} from "@/db/schema";

export type BagWithProduct = SetupBag & { product: Product };
export type ItemWithProduct = SetupItem & { product: Product };

export type SetupDetail = {
  setup: Setup;
  bike: Product | null;
  wheels: Product | null;
  bags: BagWithProduct[];
  items: ItemWithProduct[];
};

export async function getProducts(): Promise<Product[]> {
  return db.select().from(products).orderBy(asc(products.category), asc(products.name));
}

export async function getSetups(): Promise<Setup[]> {
  return db.select().from(setups).orderBy(asc(setups.createdAt));
}

export async function getSetupDetail(id: number): Promise<SetupDetail | null> {
  const [setup] = await db.select().from(setups).where(eq(setups.id, id));
  if (!setup) return null;

  const bike = setup.bikeProductId
    ? (await db.select().from(products).where(eq(products.id, setup.bikeProductId)))[0] ?? null
    : null;

  const wheels = setup.wheelProductId
    ? (await db.select().from(products).where(eq(products.id, setup.wheelProductId)))[0] ?? null
    : null;

  const bagRows = await db
    .select({ bag: setupBags, product: products })
    .from(setupBags)
    .innerJoin(products, eq(setupBags.productId, products.id))
    .where(eq(setupBags.setupId, id));

  const itemRows = await db
    .select({ item: setupItems, product: products })
    .from(setupItems)
    .innerJoin(products, eq(setupItems.productId, products.id))
    .where(eq(setupItems.setupId, id))
    .orderBy(asc(setupItems.id));

  return {
    setup,
    bike,
    wheels,
    bags: bagRows.map(({ bag, product }) => ({ ...bag, product })),
    items: itemRows.map(({ item, product }) => ({ ...item, product })),
  };
}

/** Look up a setup by its public share token (null when not shared / unknown token). */
export async function getSetupDetailByShareToken(token: string): Promise<SetupDetail | null> {
  if (!token) return null;
  const [setup] = await db.select().from(setups).where(eq(setups.shareToken, token));
  if (!setup) return null;
  return getSetupDetail(setup.id);
}

export async function getAllSetupDetails(): Promise<SetupDetail[]> {
  const all = await getSetups();
  const details = await Promise.all(all.map((s) => getSetupDetail(s.id)));
  return details.filter((d): d is SetupDetail => d !== null);
}
