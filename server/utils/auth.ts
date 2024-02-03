// server/utils/auth.ts
import { Lucia } from "lucia";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";
import { Twitch } from 'arctic'

export const client = new PrismaClient();

const adapter = new PrismaAdapter(client.session, client.user)

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		// IMPORTANT!
		attributes: {
			// set to `true` when using HTTPS
			secure: !process.dev
		}
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
	}
}

// todo: cleanup
export const twitch = new Twitch(process.env.TWTICH_CLIENT_ID || '', process.env.TWITCH_CLIENT_SECRET || '', 'http://localhost:3000/login/twitch/callback');
