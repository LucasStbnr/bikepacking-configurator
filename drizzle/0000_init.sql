CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`category` text NOT NULL,
	`weight_grams` integer,
	`price_cents` integer,
	`volume_liters` real,
	`dimensions` text,
	`size` text,
	`url` text,
	`image_url` text,
	`notes` text,
	`mount_points` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `setup_bags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`setup_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`mount_point` text NOT NULL,
	FOREIGN KEY (`setup_id`) REFERENCES `setups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `setup_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`setup_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`bag_id` integer,
	`quantity` integer DEFAULT 1 NOT NULL,
	`checked` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`setup_id`) REFERENCES `setups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bag_id`) REFERENCES `setup_bags`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `setups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`bike_product_id` integer,
	`bike_style` text DEFAULT 'gravel' NOT NULL,
	`bike_color` text DEFAULT '#1a1a17' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`bike_product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null
);
