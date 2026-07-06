"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { requireAuth } from "@/lib/auth";
import {
  BIKE_STYLES,
  MOUNT_POINTS,
  setupBags,
  setupItems,
  setups,
  type BikeStyle,
  type MountPoint,
} from "@/db/schema";

function touch(setupId: number) {
  return db
    .update(setups)
    .set({ updatedAt: sql`(unixepoch())` })
    .where(eq(setups.id, setupId));
}

export async function createSetup(formData: FormData) {
  await requireAuth();
  const name = String(formData.get("name") ?? "").trim() || "New setup";
  const [created] = await db.insert(setups).values({ name }).returning();
  revalidatePath("/");
  redirect(`/setups/${created.id}`);
}

export async function updateSetup(
  id: number,
  patch: {
    name?: string;
    description?: string | null;
    bikeProductId?: number | null;
    wheelProductId?: number | null;
    bikeStyle?: BikeStyle;
    bikeColor?: string;
  },
) {
  await requireAuth();
  if (patch.bikeStyle && !BIKE_STYLES.includes(patch.bikeStyle)) {
    throw new Error("Invalid bike style");
  }
  if (patch.bikeColor && !/^#[0-9a-fA-F]{6}$/.test(patch.bikeColor)) {
    throw new Error("Invalid color");
  }
  await db
    .update(setups)
    .set({ ...patch, updatedAt: sql`(unixepoch())` })
    .where(eq(setups.id, id));
  revalidatePath("/", "layout");
}

export async function deleteSetup(id: number) {
  await requireAuth();
  await db.delete(setups).where(eq(setups.id, id));
  revalidatePath("/", "layout");
  redirect("/");
}

export async function mountBag(setupId: number, productId: number, mountPoint: MountPoint) {
  await requireAuth();
  if (!MOUNT_POINTS.includes(mountPoint)) throw new Error("Invalid mount point");
  if (mountPoint !== "cargo") {
    await db
      .delete(setupBags)
      .where(and(eq(setupBags.setupId, setupId), eq(setupBags.mountPoint, mountPoint)));
  }
  await db.insert(setupBags).values({ setupId, productId, mountPoint });
  await touch(setupId);
  revalidatePath(`/setups/${setupId}`, "layout");
  revalidatePath("/");
}

export async function unmountBag(setupId: number, bagId: number) {
  await requireAuth();
  await db
    .delete(setupBags)
    .where(and(eq(setupBags.id, bagId), eq(setupBags.setupId, setupId)));
  await touch(setupId);
  revalidatePath(`/setups/${setupId}`, "layout");
  revalidatePath("/");
}

export async function addItem(
  setupId: number,
  productId: number,
  bagId: number | null,
) {
  await requireAuth();
  await db.insert(setupItems).values({ setupId, productId, bagId });
  await touch(setupId);
  revalidatePath(`/setups/${setupId}`, "layout");
}

export async function removeItem(setupId: number, itemId: number) {
  await requireAuth();
  await db
    .delete(setupItems)
    .where(and(eq(setupItems.id, itemId), eq(setupItems.setupId, setupId)));
  await touch(setupId);
  revalidatePath(`/setups/${setupId}`, "layout");
}

export async function setItemQuantity(setupId: number, itemId: number, quantity: number) {
  await requireAuth();
  const qty = Math.max(1, Math.min(99, Math.round(quantity)));
  await db
    .update(setupItems)
    .set({ quantity: qty })
    .where(and(eq(setupItems.id, itemId), eq(setupItems.setupId, setupId)));
  await touch(setupId);
  revalidatePath(`/setups/${setupId}`, "layout");
}

export async function duplicateSetup(id: number) {
  await requireAuth();

  const [original] = await db.select().from(setups).where(eq(setups.id, id));
  if (!original) throw new Error("Setup not found");

  const oldBags = await db.select().from(setupBags).where(eq(setupBags.setupId, id));
  const oldItems = await db.select().from(setupItems).where(eq(setupItems.setupId, id));

  const [newSetup] = await db
    .insert(setups)
    .values({
      name: `${original.name} (copy)`,
      description: original.description,
      bikeProductId: original.bikeProductId,
      wheelProductId: original.wheelProductId,
      bikeStyle: original.bikeStyle,
      bikeColor: original.bikeColor,
    })
    .returning();

  const bagIdMap = new Map<number, number>();
  for (const bag of oldBags) {
    const [newBag] = await db
      .insert(setupBags)
      .values({ setupId: newSetup.id, productId: bag.productId, mountPoint: bag.mountPoint })
      .returning();
    bagIdMap.set(bag.id, newBag.id);
  }

  for (const item of oldItems) {
    await db.insert(setupItems).values({
      setupId: newSetup.id,
      productId: item.productId,
      bagId: item.bagId ? (bagIdMap.get(item.bagId) ?? null) : null,
      quantity: item.quantity,
      checked: false,
    });
  }

  revalidatePath("/");
  redirect(`/setups/${newSetup.id}`);
}
