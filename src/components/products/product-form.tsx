"use client";

import { useState, useTransition } from "react";
import { createProduct, deleteProduct, updateProduct } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  MOUNT_POINTS,
  MOUNT_POINT_LABELS,
  PRODUCT_CATEGORIES,
  type Product,
  type ProductCategory,
} from "@/db/schema";
import { track } from "@/lib/analytics";

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  bike: "Bike",
  wheels: "Wheels",
  bag: "Bag",
  accessory: "Accessory",
  gear: "Gear",
};

export function ProductForm({
  product,
  onDone,
}: {
  product?: Product;
  onDone: () => void;
}) {
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? "gear");
  const [pending, startTransition] = useTransition();
  const isBagLike = category === "bag" || category === "accessory";

  function submit(formData: FormData) {
    startTransition(async () => {
      if (product) {
        await updateProduct(product.id, formData);
        track("product_updated", { category });
      } else {
        await createProduct(formData);
        track("product_created", { category });
      }
      onDone();
    });
  }

  function remove() {
    if (!product) return;
    if (!window.confirm(`Delete “${product.name}”? It will be removed from every setup.`)) return;
    startTransition(async () => {
      await deleteProduct(product.id);
      track("product_deleted", { category });
      onDone();
    });
  }

  return (
    <form action={submit} className="flex flex-col gap-4">
      <Field label="Category">
        <Select
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ProductCategory)}
        >
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Name" className="col-span-2">
          <Input name="name" required defaultValue={product?.name} placeholder="Seat-Pack 16.5L" />
        </Field>
        <Field label="Brand">
          <Input name="brand" defaultValue={product?.brand ?? ""} placeholder="Ortlieb" />
        </Field>
        <Field label="Size">
          <Input name="size" defaultValue={product?.size ?? ""} placeholder="M / 54 / one size" />
        </Field>
        <Field label="Weight (g)">
          <Input
            name="weightGrams"
            type="number"
            min="0"
            defaultValue={product?.weightGrams ?? ""}
            placeholder="456"
          />
        </Field>
        <Field label="Price (€)">
          <Input
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={product?.priceCents != null ? product.priceCents / 100 : ""}
            placeholder="110"
          />
        </Field>
        {isBagLike ? (
          <Field label="Volume (L)">
            <Input
              name="volumeLiters"
              type="number"
              min="0"
              step="0.1"
              defaultValue={product?.volumeLiters ?? ""}
              placeholder="16.5"
            />
          </Field>
        ) : null}
        {category === "wheels" ? (
          <Field label="Tyre width (mm)">
            <Input
              name="tireWidthMm"
              type="number"
              min="18"
              max="90"
              defaultValue={product?.tireWidthMm ?? ""}
              placeholder="35"
            />
          </Field>
        ) : null}
        <Field
          label="Dimensions"
          className={isBagLike || category === "wheels" ? "" : "col-span-2"}
        >
          <Input
            name="dimensions"
            defaultValue={product?.dimensions ?? ""}
            placeholder="62 × 26 × 20 cm"
          />
        </Field>
      </div>

      {isBagLike ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="spec-label mb-1.5">Mounts on</legend>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {MOUNT_POINTS.map((mp) => (
              <label key={mp} className="flex cursor-pointer items-center gap-2 text-sm text-ink-secondary">
                <input
                  type="checkbox"
                  name="mountPoints"
                  value={mp}
                  defaultChecked={product?.mountPoints?.includes(mp)}
                  className="size-3.5 accent-(--accent)"
                />
                {MOUNT_POINT_LABELS[mp]}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <Field label="Product link">
        <Input name="url" type="url" defaultValue={product?.url ?? ""} placeholder="https://…" />
      </Field>
      <Field label="Image URL">
        <Input name="imageUrl" type="url" defaultValue={product?.imageUrl ?? ""} placeholder="https://…/photo.jpg" />
      </Field>
      <Field label="Notes">
        <Textarea name="notes" defaultValue={product?.notes ?? ""} placeholder="Anything worth remembering…" />
      </Field>

      <div className="mt-2 flex items-center gap-2 border-t border-line pt-4">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : product ? "Save changes" : "Add to library"}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        {product ? (
          <Button variant="danger" size="sm" className="ml-auto" onClick={remove} disabled={pending}>
            Delete
          </Button>
        ) : null}
      </div>
    </form>
  );
}
