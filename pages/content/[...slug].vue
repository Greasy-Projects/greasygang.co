<script setup lang="ts">
import { ref } from "vue";
import { z, ZodBoolean, ZodError, ZodString, ZodEnum } from "zod";
import { push } from "notivue";
const errorRef = ref<{ [key: string]: string }>({});

const route = useRoute();
const slug = (route.params.slug as string[]).join("/").replace(/\/$/, "");
const path = `/website/${slug}`;
const schema: z.AnyZodObject = await getSchema(slug);
definePageMeta({
	middleware: ["protected"],
});
const formData = ref<any>();
const newData = ref(false);
function getDefaults<Schema extends z.AnyZodObject>(schema: Schema) {
	return Object.fromEntries(
		Object.entries(schema.shape).map(([key, value]) => {
			if (value instanceof z.ZodDefault)
				return [key, value._def.defaultValue()];
			return [key, undefined];
		})
	);
}
function getCheckValue<T>(key: string, kind: string): T | number {
	const checks = schema.shape[key]._def.checks;

	for (const check of checks) {
		if (check.kind === kind) {
			return check.value as T;
		}
	}
	return 0;
}
// async function fetchImages() {
// 	const repoOwner = "Greasy-Projects";
// 	const repoName = "content";
// 	const directoryPath = "website/images";
// 	const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${directoryPath}`;

// 	try {
// 		const response = await useFetch(apiUrl);

// 		const imageUrls = response.data.value
// 			.filter(
// 				item =>
// 					item.type === "file" && item.name.match(/\.(jpeg|jpg|png|gif)$/i)
// 			)
// 			.map(item => item.download_url);

// 		console.log(imageUrls);

// 		return imageUrls;
// 	} catch (error) {
// 		console.error("Error fetching images:", error);
// 		return [];
// 	}
// }
// fetchImages();
const fetch = async () => {
	try {
		formData.value = JSON.parse(
			(
				await GqlGetContent({
					path,
				})
			).content
		);
	} catch {
		formData.value = getDefaults(schema);
		newData.value = true;
	}
};
await fetch();
const validate = () => {
	try {
		schema.parse(formData.value);
		errorRef.value = {};
		return true;
	} catch (error) {
		errorRef.value = {};

		if (error instanceof ZodError) {
			error.errors.forEach(err => {
				const path = err.path.join(".");
				errorRef.value[path] = err.message;
			});
		}
		return false;
	}
};
const TypeName = (key: string, type: any) => schema.shape[key] instanceof type;
// ._def.innerType?._def.typeName ??
// schema.shape[key]._def?.schema?._def.typeName ??
// schema.shape[key]._def.typeName;

async function setTempContent() {
	try {
		if (validate()) {
			const res = await GqlSetTempContent({
				path,
				content: JSON.stringify(formData.value),
			});
			if (res.tempContent.status === 200) push.success(res.tempContent.message);
		} else {
			push.error("Invalid Data");
		}
	} catch (e) {
		push.error((e as any).gqlErrors[0].message);
	}
}
async function invalidateCache() {
	try {
		const res = await GqlInvalidateContent({ path });
		if (res.invalidateContent.status === 200)
			push.success(res.invalidateContent.message);
		if (res.invalidateContent.status === 202)
			push.warning(res.invalidateContent.message);
	} catch (e) {
		push.error((e as any).gqlErrors[0].message);
	}
	await fetch();
	validate();
}
const saveChanges = async () => {
	try {
		if (validate()) {
			const res = await GqlSetContent({
				path,
				content: JSON.stringify(formData.value),
			});
			if (res.setContent.status === 200) push.success(res.setContent.message);
			if (res.setContent.status === 202) push.warning(res.setContent.message);
			if (res.setContent.status === 500) push.error(res.setContent.message);
		} else {
			push.error("Invalid Data");
		}
	} catch (e) {
		push.error((e as any).gqlErrors[0].message);
	}
};
</script>

<template>
	<div
		class="flex min-h-screen font-poppins w-screen justify-center items-center"
	>
		<div class="mx-auto">
			<template v-for="key in Object.keys(schema.shape)" :key="key">
				<div class="flex flex-col mt-4">
					<label class="mr-2 font-bebas"
						>{{ key }}
						<span class="font-poppins text-xs">{{
							schema.shape[key].description
						}}</span></label
					>
					<p
						v-if="errorRef[key]"
						class="mr-2 py-1 text-sm text-red-600 font-bold"
					>
						{{ errorRef[key] }}
					</p>
					<div v-if="TypeName(key, ZodString)">
						<textarea
							v-model="formData[key]"
							type="text"
							class="border h-8 w-lg p-2"
							:class="{
								'resize-y': getCheckValue<number>(key, 'min') >= 100,
								'resize-none': getCheckValue<number>(key, 'min') < 100,
							}"
							:placeholder="key"
							@input="validate"
						/>
					</div>
					<div v-else-if="TypeName(key, ZodBoolean)">
						<label class="switch">
							<input v-model="formData[key]" class="size-5" type="checkbox" />
						</label>
					</div>
					<div v-else-if="TypeName(key, ZodEnum)">
						<select id="cars" v-model="formData[key]" name="cars">
							<option
								v-for="val in schema.shape[key]._def.values"
								:key="val"
							>
								{{ val }}
							</option>
						</select>
					</div>
					<div v-else>unsupported data type</div>
				</div>
			</template>
			<div class="space-x-2">
				<button
					class="mt-4 bg-button text-white py-2 px-4 rounded"
					@click="saveChanges"
				>
					{{ newData ? "Create" : "Update" }}
				</button>

				<button
					class="mt-4 bg-button text-white py-2 px-4 rounded"
					@click="setTempContent"
				>
					Update Temporarily (5m)
				</button>

				<button
					class="mt-4 bg-button text-white py-2 px-4 rounded"
					@click="invalidateCache()"
				>
					Refresh
				</button>
			</div>
			<div class="bg-secondary rounded-xl mt-4">
				<p class="text-sm w-lg text-gray-100 p-2">
					<span class="text-gray-200 font-bold">Update/Create:</span> Saves
					changes made to the content. If the content is new, it creates it. If
					the content already exists, it updates it.
				</p>
				<p class="text-sm w-lg text-gray-100 p-2">
					<span class="text-gray-200 font-bold">Update Temporarily:</span>
					Updates the content temporarily. The changes are not permanent and
					will revert after 5 minutes. The changes are global and can be seen by
					any visitors visiting within the 5 minute time frame. Useful for
					testing content before updating.
				</p>
				<p class="text-sm w-lg text-gray-100 p-2">
					<span class="text-gray-200 font-bold">Refresh:</span> Fetches the
					latest content from the server and clears the content cache for this
					specific data. This will wipe any unsaved changes you've made here,
					and overwrite Temporary changes. It may take a couple minutes for
					recent changes to show due to caching.
				</p>
			</div>
		</div>
	</div>
</template>
