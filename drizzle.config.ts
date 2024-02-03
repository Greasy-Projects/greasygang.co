import { type Config } from "drizzle-kit";
export default {
	schema: "./server/utils/schema.ts",
	out: "./drizzle",
	driver: "mysql2",
	dbCredentials: {
		host: process.env.DB_HOST || "localhost",
		user: process.env.DB_USER,
		password: process.env.DB_PASS,
		database: process.env.DB_NAME || "",
	},
} satisfies Config;
