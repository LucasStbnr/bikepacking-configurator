ALTER TABLE `products` ADD `tire_width_mm` integer;--> statement-breakpoint
ALTER TABLE `setups` ADD `wheel_product_id` integer REFERENCES products(id);