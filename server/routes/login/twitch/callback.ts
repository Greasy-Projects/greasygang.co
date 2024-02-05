import { OAuth2RequestError } from "arctic";
import { generateId } from "lucia";
import { db } from "~/server/utils/db";
import { lucia, twitch } from "~/server/utils/auth";
import { user, accountLink, twitchAccount } from "~/server/utils/schema";
import { eq } from "drizzle-orm";

export interface TwitchTokens {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresAt: Date;
}

export interface TwitchUserResponse {
	data: [
		{
			id: string;
			login: string;
			display_name: string;
			type: string;
			broadcaster_type: string;
			description: string;
			profile_image_url: string;
			offline_image_url: string;
			view_count: number;
			created_at: string;
		},
	];
}

export default defineEventHandler(async event => {
	const query = getQuery(event);
	const code = query.code?.toString() ?? null;
	const state = query.state?.toString() ?? null;
	const storedState = getCookie(event, "twitch_oauth_state") ?? null;
	if (!code || !state || !storedState || state !== storedState) {
		throw createError({
			statusCode: 400,
		});
	}

	try {
		// validate authorization code
		const tokens: TwitchTokens = await twitch.validateAuthorizationCode(code);

		const {scopes}: { scopes: String[] } = await (
			await fetch("https://id.twitch.tv/oauth2/validate", {
				headers: {
					Authorization: `Bearer ${tokens.accessToken}`,
				},
			})
		).json();
		// get user
		const twitchUserResponse = await fetch(
			"https://api.twitch.tv/helix/users",
			{
				headers: {
					Authorization: `Bearer ${tokens.accessToken}`,
					"Client-Id": process.env.TWITCH_CLIENT_ID || "",
				},
			}
		);

		const twitchUser: TwitchUserResponse = await twitchUserResponse.json();

		// // check if user exists in database
		// const [existingUser] = await db
		// 	.select()
		// 	.from(user)
		// 	.where(eq(user.twitchId, twitchUser.data[0].id))
		// 	.limit(1);

		// if (existingUser) {
		// 	const session = await lucia.createSession(existingUser.id, {});
		// 	appendResponseHeader(
		// 		event,
		// 		"Set-Cookie",
		// 		lucia.createSessionCookie(session.id).serialize()
		// 	);
		// 	return sendRedirect(event, "/dashboard");
		// }

		const twitchId = generateId(15);
		// await db.insert(twitchAccount).values({
		// 	id: twitchId,
		// 	refreshToken: tokens.refreshToken,
		// 	scope: scopes.join(" "),
		// 	userId
		// 	created_at: new Date(),
		// 	updated_at: new Date(),
		// });
		const session = await lucia.createSession(twitchId, {});
		appendResponseHeader(
			event,
			"Set-Cookie",
			lucia.createSessionCookie(session.id).serialize()
		);
		return sendRedirect(event, "/dashboard");
	} catch (e) {
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
