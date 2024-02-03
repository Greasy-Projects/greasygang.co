import { OAuth2RequestError } from "arctic";
import { generateId } from "lucia";
import { db, lucia, twitch } from "~/server/utils/auth";
import { userTable } from "~/server/utils/schema";
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
        }
    ]
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const code = query.code?.toString() ?? null;
	const state = query.state?.toString() ?? null;
    const storedState = getCookie(event, 'twitch_oauth_state') ?? null;

    if (!code || !state || !storedState || state !== storedState) {
        throw createError({
            statusCode: 400
        });
    }

    try {
        // validate authorization code
        const tokens: TwitchTokens = await twitch.validateAuthorizationCode(code);

        // get user
        const twitchUserResponse = await fetch('https://api.twitch.tv/helix/users', {
            headers: {
                Authorization: `Bearer ${tokens.accessToken}`,
                "Client-Id": process.env.TWTICH_CLIENT_ID || ''
            }
        });

        const twitchUser: TwitchUserResponse = await twitchUserResponse.json();
        
        // check if user exists in database
        const [ existingUser ] = await db.select()
            .from(userTable)
            .where(eq(userTable.twitchId, twitchUser.data[0].id))
            .limit(1);


        if(existingUser) {
            const session = await lucia.createSession(existingUser.id, {});
            appendResponseHeader(event, "Set-Cookie", lucia.createSessionCookie(session.id).serialize());
            return sendRedirect(event, '/dashboard');
        }

        const userId = generateId(15);
        await db.insert(userTable).values({
            id: userId,
            username: twitchUser.data[0].login,
            twitchId: twitchUser.data[0].id,
            display_name: twitchUser.data[0].display_name,
            avatar: twitchUser.data[0].profile_image_url,
            created_at: new Date(),
            updated_at: new Date()
        });
        const session = await lucia.createSession(userId, {});
        appendResponseHeader(event, "Set-Cookie", lucia.createSessionCookie(session.id).serialize());
        return sendRedirect(event, '/dashboard');
    } catch(e) {
        if(e instanceof OAuth2RequestError) {
            throw createError({
                statusCode: 400
            });
        }
        throw createError({
            statusCode: 500
        });
    }
});

