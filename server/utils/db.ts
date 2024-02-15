import "dotenv/config";
import mysql from "mysql2";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import {
	user,
	accountLink,
	discordAccount,
	twitchAccount,
} from "~/server/utils/schema";
import { generateId } from "lucia";

export const connection = mysql.createConnection({
	host: process.env.DB_HOST || "localhost",
	user: process.env.DB_USER || "root",
	password: process.env.DB_PASS || "",
	database: process.env.DB_NAME || "greasy",
	multipleStatements: true,
});
export const db = drizzle(connection);

export function id() {
	return generateId(15);
}

export function newTimestamps(): {
	created_at: Date;
	updated_at: Date;
} {
	return {
		created_at: new Date(),
		updated_at: new Date(),
	};
}

export function updateTimestamps(): {
	updated_at: Date;
} {
	return {
		updated_at: new Date(),
	};
}

export async function getOrCreateUser(
	platform: "discord" | "twitch",
	platformUserId: string,
	platformUserEmail: string | null
): Promise<{ type: "new" | "existing" | "nolink"; userId: string }> {
	let linkType!: typeof accountLink.twitchId | typeof accountLink.discordId,
		otherPlatform!: typeof discordAccount | typeof twitchAccount;
	if (platform === "twitch") {
		linkType = accountLink.twitchId;
		otherPlatform = discordAccount;
	} else if (platform === "discord") {
		linkType = accountLink.discordId;
		otherPlatform = twitchAccount;
	}

	// check if OAuth account is already linked
	const [existingLink] = await db
		.select()
		.from(accountLink)
		.where(eq(linkType, platformUserId))
		.limit(1);
	if (existingLink) return { type: "existing", userId: existingLink.userId };

	if (platformUserEmail !== null) {
		const [existingUserWithEmail] = await db
			.select()
			.from(otherPlatform)
			.where(eq(otherPlatform.email, platformUserEmail));

		await db.update(accountLink).set({
			...newTimestamps(),
		});
		
		if (existingUserWithEmail)
			return { type: "new", userId: existingUserWithEmail.userId };
	}
	const newUserId = id();
	await db.insert(user).values({ id: newUserId, ...newTimestamps() });
	await db.insert(accountLink).values({
		id: id(),
		userId: newUserId,
		...newTimestamps(),
	});
	return { type: "new", userId: newUserId };
}

export function getOrCreateLink() {}
