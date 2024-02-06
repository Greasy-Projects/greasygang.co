ALTER TABLE `account_link` MODIFY COLUMN `twitchId` varchar(100);--> statement-breakpoint
ALTER TABLE `account_link` MODIFY COLUMN `discordId` varchar(100);--> statement-breakpoint
ALTER TABLE `twitch_account` ADD `accessTokenExpiresAt` datetime NOT NULL;