"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireAuth } from "@/lib/auth";
import { setupBags, setupItems } from "@/db/schema";

export async function setItemChecked(setupId: number, itemId: number, checked: boolean) {
  await requireAuth();
  await db
    .update(setupItems)
    .set({ checked })
    .where(and(eq(setupItems.id, itemId), eq(setupItems.setupId, setupId)));
  revalidatePath(`/setups/${setupId}/checklist`);
}

export async function setBagChecked(setupId: number, bagId: number, checked: boolean) {
  await requireAuth();
  await db
    .update(setupBags)
    .set({ checked })
    .where(and(eq(setupBags.id, bagId), eq(setupBags.setupId, setupId)));
  revalidatePath(`/setups/${setupId}/checklist`);
}

export async function resetChecklist(setupId: number) {
  await requireAuth();
  await Promise.all([
    db
      .update(setupItems)
      .set({ checked: false })
      .where(eq(setupItems.setupId, setupId)),
    db
      .update(setupBags)
      .set({ checked: false })
      .where(eq(setupBags.setupId, setupId)),
  ]);
  revalidatePath(`/setups/${setupId}/checklist`);
}
