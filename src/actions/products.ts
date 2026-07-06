"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireAuth } from "@/lib/auth";
import {
  MOUNT_POINTS,
  PRODUCT_CATEGORIES,
  products,
  type MountPoint,
  type ProductCategory,
} from "@/db/schema";

function parseProductForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required");

  const category = String(formData.get("category") ?? "gear") as ProductCategory;
  if (!PRODUCT_CATEGORIES.includes(category)) throw new Error("Invalid category");

  const num = (key: string) => {
    const raw = String(formData.get(key) ?? "").trim().replace(",", ".");
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : null;
  };

  const text = (key: string) => {
    const raw = String(formData.get(key) ?? "").trim();
    return raw || null;
  };

  const mountPoints = formData
    .getAll("mountPoints")
    .map(String)
    .filter((m): m is MountPoint => (MOUNT_POINTS as readonly string[]).includes(m));

  const price = num("price");
  const tireWidth = num("tireWidthMm");
  return {
    name,
    category,
    brand: text("brand"),
    weightGrams: num("weightGrams") !== null ? Math.round(num("weightGrams")!) : null,
    priceCents: price !== null ? Math.round(price * 100) : null,
    volumeLiters: num("volumeLiters"),
    dimensions: text("dimensions"),
    size: text("size"),
    url: text("url"),
    notes: text("notes"),
    mountPoints: category === "bag" || category === "accessory" ? mountPoints : null,
    tireWidthMm:
      category === "wheels" && tireWidth !== null ? Math.round(tireWidth) : null,
  };
}

export async function createProduct(formData: FormData) {
  await requireAuth();
  const values = parseProductForm(formData);
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;
  await db.insert(products).values({ ...values, imageUrl });
  revalidatePath("/", "layout");
}

export async function updateProduct(id: number, formData: FormData) {
  await requireAuth();
  const values = parseProductForm(formData);
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;
  await db.update(products).set({ ...values, imageUrl }).where(eq(products.id, id));
  revalidatePath("/", "layout");
}

export async function deleteProduct(id: number) {
  await requireAuth();
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/", "layout");
}
