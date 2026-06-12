import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

const vec2Schema = z.object({ x: z.number(), z: z.number() }).strict();
const vec3Schema = z
	.object({ x: z.number(), y: z.number(), z: z.number() })
	.strict();
const valueSchema = z.union([z.number(), vec3Schema, vec2Schema]);

const payloadSchema = z.object({
	collectionKey: z.string().min(1),
	objectKey: z.string().min(1),
	path: z
		.array(z.string().regex(/^[A-Za-z_]\w*$/))
		.min(1)
		.max(3),
	value: valueSchema,
});
const bodySchema = z.union([
	payloadSchema,
	z.object({ updates: z.array(payloadSchema).min(1) }).strict(),
]);

type Payload = z.infer<typeof payloadSchema>;

function findMatchingBrace(source: string, openIndex: number) {
	let depth = 0;
	let quote: string | null = null;
	let escaped = false;
	for (let index = openIndex; index < source.length; index++) {
		const char = source[index];
		if (quote) {
			if (escaped) {
				escaped = false;
			} else if (char === "\\") {
				escaped = true;
			} else if (char === quote) {
				quote = null;
			}
			continue;
		}
		if (char === '"' || char === "'" || char === "`") {
			quote = char;
			continue;
		}
		if (char === "{") depth++;
		if (char === "}") {
			depth--;
			if (depth === 0) return index;
		}
	}
	return -1;
}

function findObjectBlock(source: string, key: string, startAt = 0) {
	const keyPattern = `key: "${key}"`;
	const keyIndex = source.indexOf(keyPattern, startAt);
	if (keyIndex === -1) return null;
	const openIndex = source.lastIndexOf("{", keyIndex);
	const closeIndex = findMatchingBrace(source, openIndex);
	if (openIndex === -1 || closeIndex === -1) return null;
	return {
		openIndex,
		closeIndex,
		body: source.slice(openIndex, closeIndex + 1),
	};
}

function formatValue(value: Payload["value"]) {
	if (typeof value === "number") return String(value);
	if ("y" in value) return `{ x: ${value.x}, y: ${value.y}, z: ${value.z} }`;
	return `{ x: ${value.x}, z: ${value.z} }`;
}

function replacePropertyValue(
	block: string,
	property: string,
	value: Payload["value"]
) {
	const propertyIndex = block.indexOf(`${property}:`);
	if (propertyIndex === -1) return block;
	const valueStart = block.indexOf(":", propertyIndex) + 1;
	let cursor = valueStart;
	while (/\s/.test(block[cursor] ?? "")) cursor++;

	let valueEnd = cursor;
	if (block[cursor] === "{") {
		valueEnd = findMatchingBrace(block, cursor) + 1;
	} else {
		while (valueEnd < block.length && !/[,\n}]/.test(block[valueEnd]))
			valueEnd++;
	}
	if (valueEnd <= cursor) return block;
	return block.slice(0, cursor) + formatValue(value) + block.slice(valueEnd);
}

function updateByPath(block: string, path: string[], value: Payload["value"]) {
	if (path.length === 1) return replacePropertyValue(block, path[0], value);

	const [head, ...tail] = path;
	const propertyIndex = block.indexOf(`${head}:`);
	if (propertyIndex === -1) return block;
	const openIndex = block.indexOf("{", propertyIndex);
	const closeIndex = findMatchingBrace(block, openIndex);
	if (openIndex === -1 || closeIndex === -1) return block;

	const nested = block.slice(openIndex, closeIndex + 1);
	const updatedNested = updateByPath(nested, tail, value);
	return (
		block.slice(0, openIndex) + updatedNested + block.slice(closeIndex + 1)
	);
}

export default defineEventHandler(async event => {
	if (process.env.NODE_ENV !== "development") {
		throw createError({ statusCode: 404, statusMessage: "Not Found" });
	}

	const body = bodySchema.parse(await readBody(event));
	const payloads = "updates" in body ? body.updates : [body];
	const layoutDir = join(process.cwd(), "components/greasy-diner/layout");
	const files = (await readdir(layoutDir)).filter(file => file.endsWith(".ts"));
	const updatedFiles = new Set<string>();

	for (const payload of payloads) {
		let didUpdate = false;
		for (const file of files) {
			const path = join(layoutDir, file);
			const source = await readFile(path, "utf8");
			const collection = findObjectBlock(source, payload.collectionKey);
			if (!collection) continue;
			const object = findObjectBlock(collection.body, payload.objectKey);
			if (!object) continue;

			const updatedObject = updateByPath(
				object.body,
				payload.path,
				payload.value
			);
			if (updatedObject === object.body) {
				throw createError({
					statusCode: 422,
					statusMessage: `Could not update ${payload.path.join(".")} for ${payload.collectionKey}.${payload.objectKey}`,
				});
			}

			const updatedCollection =
				collection.body.slice(0, object.openIndex) +
				updatedObject +
				collection.body.slice(object.closeIndex + 1);
			const updatedSource =
				source.slice(0, collection.openIndex) +
				updatedCollection +
				source.slice(collection.closeIndex + 1);
			await writeFile(path, updatedSource);
			updatedFiles.add(`components/greasy-diner/layout/${file}`);
			didUpdate = true;
			break;
		}

		if (!didUpdate) {
			throw createError({
				statusCode: 404,
				statusMessage: `Could not find ${payload.collectionKey}.${payload.objectKey}`,
			});
		}
	}

	return { ok: true, files: [...updatedFiles], count: payloads.length };
});
