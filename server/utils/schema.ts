import { mysqlTable, varchar, text, datetime } from "drizzle-orm/mysql-core";

const createdUpdated = {
	created_at: datetime("created_at").notNull(),
	updated_at: datetime("updated_at").notNull(),
};

export const accountLink = mysqlTable("account_link", {
	id: varchar("id", {
		length: 100,
	}).primaryKey(),
	userId: varchar("userId", {
		length: 100,
	})
		.notNull()
		.references(() => user.id),
	twitchId: varchar("twitchId", {
		length: 100,
	})
		.notNull()
		.references(() => twitchAccount.id),
	discordId: varchar("discordId", {
		length: 100,
	})
		.notNull()
		.references(() => discordAccount.id),
	...createdUpdated,
});

export const user = mysqlTable("user", {
	id: varchar("id", {
		length: 100,
	}).primaryKey(),
	primary: varchar("varchar", {
		length: 7,
		enum: ["twitch", "discord"],
	}).default("twitch"),
	...createdUpdated,
});

export const twitchAccount = mysqlTable("twitch_account", {
	id: varchar("id", {
		length: 100,
	}).primaryKey(),
	email: varchar("email", {
		length: 100,
	}),
	accessToken: varchar("access_token", {
		length: 100,
	}),
	refreshToken: varchar("refresh_token", {
		length: 100,
	}),
	scope: varchar("scope", {
		length: 255,
	}).notNull(),
	userId: varchar("userId", {
		length: 100,
	})
		.notNull()
		.references(() => user.id),
	username: text("username").notNull(),
	...createdUpdated,
});

export const discordAccount = mysqlTable("discord_account", {
	id: varchar("id", {
		length: 100,
	}).primaryKey(),
	email: varchar("email", {
		length: 100,
	}),
	userId: varchar("userId", {
		length: 100,
	})
		.notNull()
		.references(() => user.id),
	username: varchar("username", {
		length: 32,
	}).notNull(),
	global_name: varchar("global_name", {
		length: 32,
	}).notNull(),
	discordId: varchar("discordId", {
		length: 22,
	}).notNull(),
	avatar: varchar("avatar", { length: 100 }).notNull(),
	...createdUpdated,
});

export const session = mysqlTable("session", {
	id: varchar("id", {
		length: 255,
	}).primaryKey(),
	userId: varchar("userId", {
		length: 100,
	})
		.notNull()
		.references(() => user.id),
	expiresAt: datetime("expiresAt").notNull(),
});
