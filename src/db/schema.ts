import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const PRODUCT_CATEGORIES = ["bike", "wheels", "bag", "accessory", "gear"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const BIKE_STYLES = ["gravel", "road", "mtb", "touring"] as const;
export type BikeStyle = (typeof BIKE_STYLES)[number];

export const MOUNT_POINTS = [
  "handlebar",
  "stem",
  "toptube",
  "frame",
  "downtube",
  "fork_left",
  "fork_right",
  "saddle",
  "rear_rack",
  "cyclist",
  "cargo",
] as const;
export type MountPoint = (typeof MOUNT_POINTS)[number];

/** Zones that hold any number of bags (everywhere else: one bag max). */
export const MULTI_BAG_MOUNT_POINTS = [
  "toptube",
  "cyclist",
  "cargo",
] as const satisfies readonly MountPoint[];

export const MOUNT_POINT_LABELS: Record<MountPoint, string> = {
  handlebar: "Handlebar",
  stem: "Stem",
  toptube: "Top tube",
  frame: "Frame",
  downtube: "Down tube",
  fork_left: "Fork (left)",
  fork_right: "Fork (right)",
  saddle: "Saddle",
  rear_rack: "Rear rack",
  cyclist: "Worn by cyclist",
  cargo: "Cargo / other",
} as const;

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  brand: text("brand"),
  category: text("category").$type<ProductCategory>().notNull(),
  weightGrams: integer("weight_grams"),
  priceCents: integer("price_cents"),
  volumeLiters: real("volume_liters"),
  dimensions: text("dimensions"),
  size: text("size"),
  url: text("url"),
  imageUrl: text("image_url"),
  notes: text("notes"),
  mountPoints: text("mount_points", { mode: "json" }).$type<MountPoint[]>(),
  // wheels only: tyre section width in mm (e.g. 28 road, 35 gravel, 60 MTB)
  tireWidthMm: integer("tire_width_mm"),
  // free-form, lowercase tags for search & filtering
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const setups = sqliteTable("setups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  bikeProductId: integer("bike_product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  wheelProductId: integer("wheel_product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  bikeStyle: text("bike_style").$type<BikeStyle>().notNull().default("gravel"),
  bikeColor: text("bike_color").notNull().default("#1a1a17"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const setupBags = sqliteTable("setup_bags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  setupId: integer("setup_id")
    .notNull()
    .references(() => setups.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  mountPoint: text("mount_point").$type<MountPoint>().notNull(),
  checked: integer("checked", { mode: "boolean" }).notNull().default(false),
});

export const setupItems = sqliteTable("setup_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  setupId: integer("setup_id")
    .notNull()
    .references(() => setups.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  bagId: integer("bag_id").references(() => setupBags.id, {
    onDelete: "set null",
  }),
  quantity: integer("quantity").notNull().default(1),
  checked: integer("checked", { mode: "boolean" }).notNull().default(false),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Setup = typeof setups.$inferSelect;
export type NewSetup = typeof setups.$inferInsert;
export type SetupBag = typeof setupBags.$inferSelect;
export type SetupItem = typeof setupItems.$inferSelect;
