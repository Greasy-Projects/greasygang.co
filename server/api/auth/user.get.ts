import { eq } from "drizzle-orm";
import { db } from "~/server/utils/db";
async function getUser(userId: string) {
	const [SOMETHING] = await db
		.select()
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);
	let platformTable!: typeof discordAccount | typeof twitchAccount;
	if (SOMETHING.primary === "twitch") platformTable = twitchAccount;
	if (SOMETHING.primary === "discord") platformTable = discordAccount;
	const [platformDetails] = await db
		.select()
		.from(platformTable)
		.where(eq(platformTable.userId, userId))
		.limit(1);
	return {
		id: platformDetails.id,
		userId,
		avatar: platformDetails.avatar ?? "/pfp.png",
		username: platformDetails.username,
	};
}

export default defineEventHandler(async event => {
	if (event.context.user) {
		return { ...(await getUser(event.context.user.id)) };
	} else return {};
});
