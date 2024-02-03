import { mysqlTable, int, varchar, text, datetime } from "drizzle-orm/mysql-core";
import { relations } from 'drizzle-orm';

export const userTable = mysqlTable("user", {
	id: varchar("id", {
		length: 255
	}).primaryKey(),
	username: text("username").notNull(),
	twitchId: text("twitchId").notNull(),
	display_name: text("display_name").notNull(),
	avatar: text("avatar").notNull(),
	created_at: datetime("created_at").notNull(),
	updated_at: datetime("updated_at").notNull(),
});
		

export const sessionTable = mysqlTable("session", {
	id: varchar("id", {
		length: 255
	}).primaryKey(),
	userId: varchar("userId", {
		length: 255
	})
		.notNull()
		.references(() => userTable.id),
	expiresAt: datetime("expiresAt").notNull()

});
