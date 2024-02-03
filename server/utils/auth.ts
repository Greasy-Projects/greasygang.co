// server/utils/auth.ts
import { Lucia } from "lucia";
import { Twitch } from 'arctic'

import { DrizzleMySQLAdapter } from "@lucia-auth/adapter-drizzle";
import { sessionTable, userTable } from './schema';
import { drizzle } from "drizzle-orm/mysql2";
import  mysql from 'mysql2';

const connection = mysql.createConnection({
	host: process.env.DB_HOST || 'localhost',
	user: process.env.DB_USER || 'root',
	password: process.env.DB_PASS || '',
	database: process.env.DB_NAME || 'greasy'
});

export const db = drizzle(connection);
const adapter = new DrizzleMySQLAdapter(db, sessionTable, userTable);

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
