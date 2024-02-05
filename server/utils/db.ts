import "dotenv/config";
import mysql from "mysql2";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema"
export const connection = mysql.createConnection({
	host: process.env.DB_HOST || "localhost",
	user: process.env.DB_USER || "root",
	password: process.env.DB_PASS || "",
	database: process.env.DB_NAME || "greasy",
	multipleStatements: true,
});
export const db = drizzle(connection);

export function getOrCreateUser(type: "discord" | "twitch", ) {

}
