CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` datetime,
	`refreshTokenExpiresAt` datetime,
	`scope` text,
	`password` text,
	`createdAt` datetime NOT NULL,
	`updatedAt` datetime NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_providerId_accountId_key` ON `account` (`providerId`,`accountId`);--> statement-breakpoint
CREATE TABLE `apiKey` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT 'Default' NOT NULL,
	`keyHash` text NOT NULL,
	`keyPrefix` text NOT NULL,
	`userId` text NOT NULL,
	`lastUsedAt` datetime,
	`createdAt` datetime NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `apiKey_keyHash_key` ON `apiKey` (`keyHash`);--> statement-breakpoint
CREATE UNIQUE INDEX `apiKey_userId_key` ON `apiKey` (`userId`);--> statement-breakpoint
CREATE TABLE `bookmark` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`url` text,
	`normalizedUrl` text,
	`favicon` text,
	`type` text DEFAULT 'link' NOT NULL,
	`color` text,
	`isPublic` integer,
	`primarySource` text,
	`sourceHistory` text,
	`lastCapturedAt` datetime,
	`groupId` text NOT NULL,
	`userId` text NOT NULL,
	`createdAt` datetime NOT NULL,
	`updatedAt` datetime NOT NULL,
	FOREIGN KEY (`groupId`) REFERENCES `group`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bookmark_userId_idx` ON `bookmark` (`userId`);--> statement-breakpoint
CREATE INDEX `bookmark_userId_isPublic_idx` ON `bookmark` (`userId`,`isPublic`);--> statement-breakpoint
CREATE INDEX `bookmark_groupId_idx` ON `bookmark` (`groupId`);--> statement-breakpoint
CREATE INDEX `bookmark_createdAt_idx` ON `bookmark` (`createdAt`);--> statement-breakpoint
CREATE INDEX `bookmark_userId_normalizedUrl_idx` ON `bookmark` (`userId`,`normalizedUrl`);--> statement-breakpoint
CREATE TABLE `group` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`isPublic` integer DEFAULT false NOT NULL,
	`userId` text NOT NULL,
	`createdAt` datetime NOT NULL,
	`updatedAt` datetime NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `group_userId_idx` ON `group` (`userId`);--> statement-breakpoint
CREATE INDEX `group_userId_isPublic_idx` ON `group` (`userId`,`isPublic`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` datetime NOT NULL,
	`token` text NOT NULL,
	`createdAt` datetime NOT NULL,
	`updatedAt` datetime NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_key` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer DEFAULT false NOT NULL,
	`image` text,
	`username` text,
	`bio` text,
	`github` text,
	`twitter` text,
	`website` text,
	`isProfilePublic` integer DEFAULT false NOT NULL,
	`plan` text DEFAULT 'free' NOT NULL,
	`subscriptionStatus` text,
	`polarCustomerId` text,
	`polarCustomerExternalId` text,
	`polarSubscriptionId` text,
	`polarProductId` text,
	`polarCheckoutId` text,
	`subscriptionCurrentPeriodEnd` datetime,
	`subscriptionCancelAtPeriodEnd` integer DEFAULT false NOT NULL,
	`subscriptionCanceledAt` datetime,
	`planUpdatedAt` datetime,
	`createdAt` datetime NOT NULL,
	`updatedAt` datetime NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_key` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_key` ON `user` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_polarCustomerId_key` ON `user` (`polarCustomerId`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_polarSubscriptionId_key` ON `user` (`polarSubscriptionId`);--> statement-breakpoint
CREATE INDEX `user_createdAt_idx` ON `user` (`createdAt`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` datetime NOT NULL,
	`createdAt` datetime NOT NULL,
	`updatedAt` datetime NOT NULL
);
