import { OAuth2RequestError, type TwitchTokens } from "arctic";
import {
	db,
	getOrCreateUser,
	newTimestamps,
	updateTimestamps,
} from "~/server/utils/db";
import { lucia, twitch } from "~/server/utils/auth";
import { twitchAccount } from "~/server/utils/schema";
import { eq } from "drizzle-orm";
import { getObjectDifferences } from "~/server/utils/functions";

export interface TwitchUserResponse {
	id: string;
	login: string;
	email: string;
	display_name: string;
	type: string;
	broadcaster_type: string;
	description: string;
	profile_image_url: string;
	offline_image_url: string;
	view_count: number;
	created_at: string;
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

		const { scopes }: { scopes: String[] } = await (
				await fetch("https://id.twitch.tv/oauth2/validate", {
					headers: {
						Authorization: `Bearer ${tokens.accessToken}`,
					},
				})
			).json(),
			scope = scopes.join(" ");

		const twitchUserResponse = await fetch(
			"https://api.twitch.tv/helix/users",
			{
				headers: {
					Authorization: `Bearer ${tokens.accessToken}`,
					"Client-Id": process.env.TWITCH_CLIENT_ID || "",
				},
			}
		);

		const twitchUser: TwitchUserResponse = (await twitchUserResponse.json())
			.data[0];

		const user = await getOrCreateUser(
			"twitch",
			twitchUser.id,
			twitchUser.email
		);
		console.log(user);
		//TODO: check for updates in user
		const values = {
			id: twitchUser.id,
			userId: user.userId,
			email: twitchUser.email,
			username: twitchUser.login,
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			accessTokenExpiresAt: tokens.accessTokenExpiresAt,
			scope,
			avatar: twitchUser.profile_image_url,
		};
		//TODO: tomorrow, now sleep 
		if (user.type === "existing") {
			const [existingTwitchUser] = await db
				.select()
				.from(twitchAccount)
				.where(eq(twitchAccount.userId, user.userId));
			console.log(getObjectDifferences(twitchUser, existingTwitchUser));
		}

		console.log(user.type);
		if (user.type === "new") {
			//create twitch account
			await db.insert(twitchAccount).values({
				...values,
				...newTimestamps(),
			});
			// link twitch account
			await db
				.update(accountLink)
				.set({
					twitchId: twitchUser.id,
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
