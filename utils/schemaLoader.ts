import { z } from "zod";
import fs from "fs/promises";

export const getAllSchemas = async () => {
	return (await fs.readdir("schemas")).map(file => file.replace(/\.ts$/, ""));
};

export const getSchema = async (slug: string): Promise<z.AnyZodObject> => {
	try {
		const { default: schema } = await import(`~/schemas/${slug}.ts`);
		return schema;
	} catch (error) {
		throw new Error(`Schema with slug '${slug}' not found`);
	}
};
