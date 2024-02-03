import { OAuth2RequestError } from "arctic";
import { generateId } from "lucia";
import { db } from "~/server/utils/db";
import { lucia, twitch } from "~/server/utils/auth";
import { userTable } from "~/server/utils/schema";
import { eq } from "drizzle-orm";

interface TokenResponseBody {
	access_token: string;
	expires_in: number;
	refresh_token: string;
}

export interface DiscordTokens {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresAt: Date;
}

export interface DiscordUserResponse {
    id: string;
    username: string;
    discriminator: string;
    global_name?: string;
    avatar: string;
    bot?: boolean;
    system?: boolean;
    mfa_enabled?: boolean;
    locale?: string;
    verified?: boolean;
    email?: string;
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
            
        // check if user exists in database
		const [existingUser] = await db
            .select()
            .from(userTable)
            .where(eq(userTable.discordId, discordUser.id))
            .limit(1);

        if (existingUser) {
			const session = await lucia.createSession(existingUser.id, {});
			appendResponseHeader(
				event,
				"Set-Cookie",
				lucia.createSessionCookie(session.id).serialize()
			);
			return sendRedirect(event, "/dashboard");
        }

        const userId = generateId(15);
		await db.insert(userTable).values({
			id: userId,
			username: discordUser.username,
			discordId: discordUser.id,
			display_name: discordUser.global_name || discordUser.username,
			avatar: discordUser.avatar,
			created_at: new Date(),
			updated_at: new Date(),
		});
		const session = await lucia.createSession(userId, {});
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
