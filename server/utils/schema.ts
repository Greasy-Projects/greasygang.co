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
		.references(() => user.id)
		.unique(),
	twitchId: varchar("twitchId", {
		length: 100,
	}).references(() => twitchAccount.id),
	discordId: varchar("discordId", {
		length: 100,
	}).references(() => discordAccount.id),
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
	username: text("username").notNull(),
	email: varchar("email", {
		length: 100,
	}),
	userId: varchar("userId", {
		length: 100,
	})
		.notNull()
		.references(() => user.id)
		.unique(),

	scope: varchar("scope", {
		length: 255,
	}).notNull(),
	accessToken: varchar("access_token", {
		length: 100,
	}),
	accessTokenExpiresAt: datetime("accessTokenExpiresAt").notNull(),
	refreshToken: varchar("refresh_token", {
		length: 100,
	}),
	avatar: varchar("avatar", { length: 255 }),
	...createdUpdated,
});

export const discordAccount = mysqlTable("discord_account", {
	id: varchar("id", {
		length: 100,
	}).primaryKey(),
	username: varchar("username", {
		length: 32,
	}).notNull(),
	global_name: varchar("global_name", {
		length: 32,
	}).notNull(),
	email: varchar("email", {
		length: 100,
	}),
	userId: varchar("userId", {
		length: 100,
	})
		.notNull()
		.references(() => user.id)
		.unique(),
	avatar: varchar("avatar", { length: 100 }),
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
