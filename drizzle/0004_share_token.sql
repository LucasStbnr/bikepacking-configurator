ALTER TABLE `setups` ADD `share_token` text;--> statement-breakpoint
CREATE UNIQUE INDEX `setups_share_token_unique` ON `setups` (`share_token`);