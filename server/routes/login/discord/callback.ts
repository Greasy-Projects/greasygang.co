import { type DiscordTokens, OAuth2RequestError } from "arctic";
import { db } from "~/server/utils/db";
import { lucia } from "~/server/utils/auth";
import { eq } from "drizzle-orm";
import { getObjectDifferences } from "~/server/utils/functions";

export interface DiscordUserResponse {
	id: string;
	username: string;
	discriminator: string;
	global_name: string;
	avatar: string;
	bot?: boolean;
	system?: boolean;
	mfa_enabled?: boolean;
	locale?: string;
	verified?: boolean;
	email: string | null;
	flags?: number;
	premium_type?: number;
	public_flags?: number;
}

export default defineEventHandler(async event => {
	const query = getQuery(event);
	const code = query.code?.toString() ?? null;
	const state = query.state?.toString() ?? null;
	const storedState = getCookie(event, "discord_oauth_state") ?? null;

	if (!code || !state || !storedState || state !== storedState) {
		throw createError({
			statusCode: 400,
		});
	}

	try {
		// validate authorization code
		const tokens: DiscordTokens = await discord.validateAuthorizationCode(code);

		// get user
		const discordUserResponse = await fetch(
			"https://discord.com/api/users/@me",
			{
				headers: {
					Authorization: `Bearer ${tokens.accessToken}`,
				},
			}
		);

		const discordUser: DiscordUserResponse = await discordUserResponse.json();

		// console.log(discordUser);
		// if email doesn't exist for some reason, we're gonna have a huge problem.
		if (!discordUser.verified) return sendRedirect(event, "/"); //get fucked
		const user = await getOrCreateUser(
			"discord",
			discordUser.id,
			discordUser.email
		);

		// if (user.type === "existing") {
		// 	const session = await lucia.createSession(user.userId, {});
		// 	appendResponseHeader(
		// 		event,
		// 		"Set-Cookie",
		// 		lucia.createSessionCookie(session.id).serialize()
		// 	);

		// 	const [discordUser] = await db
		// 		.select()
		// 		.from(discordAccount)
		// 		.where(eq(discordAccount.userId, user.userId));

		// 	// console.log(getObjectDifferences(discordUser, twitch));
		// 	return sendRedirect(event, "/dashboard");
		// }

		// create discord account

		if (user.type === "new") {
			await db.insert(discordAccount).values({
				id: discordUser.id,
				username: discordUser.username,
				userId: user.userId,
				email: discordUser.email,
				global_name: discordUser.global_name,
				avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}`,
				...newTimestamps(),
			});
			await db
				.update(accountLink)
				.set({
					discordId: discordUser.id,
					...updateTimestamps(),
				})
				.where(eq(accountLink.userId, user.userId));
		}
		const session = await lucia.createSession(user.userId, {});
		appendResponseHeader(
			event,
			"Set-Cookie",
			lucia.createSessionCookie(session.id).serialize()
		);
		return sendRedirect(event, "/dashboard");
	} catch (e) {
		console.log(e);
		if (e instanceof OAuth2RequestError) {
			throw createError({
				statusCode: 400,
			});
		}
		throw createError({
			statusCode: 500,
		});
	}
});
