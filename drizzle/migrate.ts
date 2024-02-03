import "dotenv/config";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

async function main() {
	try {
		const client = await mysql.createConnection({
			host: process.env.DB_HOST || "localhost",
			user: process.env.DB_USER || "root",
			password: process.env.DB_PASS || "",
			database: process.env.DB_NAME || "greasy",
		});

		const db = drizzle(client);

		await migrate(db, {
			migrationsFolder: "drizzle/migrations",
		});
		console.log("Tables migrated!");
		process.exit(0);
	} catch (error) {
		console.error("Error performing migration: ", error);
		process.exit(1);
	}
}

main();
