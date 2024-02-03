// server/utils/auth.ts
import { Lucia } from "lucia";
import { Twitch, Discord } from "arctic";

import { DrizzleMySQLAdapter } from "@lucia-auth/adapter-drizzle";
import { sessionTable, userTable } from "./schema";

const adapter = new DrizzleMySQLAdapter(db, sessionTable, userTable);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		// IMPORTANT!
		attributes: {
			// set to `true` when using HTTPS
			secure: !process.dev,
		},
	},
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
	}
}

// todo: cleanup
export const twitch = new Twitch(
	process.env.TWITCH_CLIENT_ID || "",
	process.env.TWITCH_CLIENT_SECRET || "",
	"http://localhost:3000/login/twitch/callback"
);

export const discord = new Discord(
	process.env.DISCORD_CLIENT_ID || "",
	process.env.DISCORD_CLIENT_SECRET || "",
	"http://localhost:3000/login/discord/callback"
);