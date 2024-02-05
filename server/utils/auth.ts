// server/utils/auth.ts
import { Lucia } from "lucia";
import { Twitch, Discord } from "arctic";

import { DrizzleMySQLAdapter } from "@lucia-auth/adapter-drizzle";
import { session, user } from "./schema";

const adapter = new DrizzleMySQLAdapter(db, session, user);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		// IMPORTANT!
		attributes: {
			// set to `true` when using HTTPS
			secure: !process.dev,
		},
	},
	getUserAttributes: attributes => {
		return {
			username: attributes.username,
			displayName: attributes.display_name,
			avatar: attributes.avatar,
			twitchId: attributes.twitchId,
		};
	},
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}

	interface DatabaseUserAttributes {
		username: string;
		display_name: string;
		avatar: string;
		twitchId: string;
	}
}

export const twitch = new Twitch(
	process.env.TWITCH_CLIENT_ID!,
	process.env.TWITCH_CLIENT_SECRET!,
	"http://localhost:3000/login/twitch/callback"
);

export const discord = new Discord(
	process.env.DISCORD_CLIENT_ID!,
	process.env.DISCORD_CLIENT_SECRET!,
	"http://localhost:3000/link/discord/callback"
);
