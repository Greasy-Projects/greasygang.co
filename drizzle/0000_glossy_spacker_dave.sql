CREATE TABLE `account_link` (
	`id` varchar(100) NOT NULL,
	`userId` varchar(100) NOT NULL,
	`twitchId` varchar(100),
	`discordId` varchar(100),
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `account_link_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discord_account` (
	`id` varchar(100) NOT NULL,
	`email` varchar(100),
	`userId` varchar(100) NOT NULL,
	`username` varchar(32) NOT NULL,
	`global_name` varchar(32) NOT NULL,
	`discordId` varchar(22) NOT NULL,
	`avatar` varchar(100) NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `discord_account_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(255) NOT NULL,
	`userId` varchar(100) NOT NULL,
	`expiresAt` datetime NOT NULL,
	CONSTRAINT `session_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `twitch_account` (
	`id` varchar(100) NOT NULL,
	`email` varchar(100),
	`access_token` varchar(100),
	`accessTokenExpiresAt` datetime NOT NULL,
	`refresh_token` varchar(100),
	`scope` varchar(255) NOT NULL,
	`userId` varchar(100) NOT NULL,
	`username` text NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `twitch_account_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(100) NOT NULL,
	`varchar` varchar(7) DEFAULT 'twitch',
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `user_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `account_link` ADD CONSTRAINT `account_link_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `account_link` ADD CONSTRAINT `account_link_twitchId_twitch_account_id_fk` FOREIGN KEY (`twitchId`) REFERENCES `twitch_account`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `account_link` ADD CONSTRAINT `account_link_discordId_discord_account_id_fk` FOREIGN KEY (`discordId`) REFERENCES `discord_account`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discord_account` ADD CONSTRAINT `discord_account_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `twitch_account` ADD CONSTRAINT `twitch_account_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;