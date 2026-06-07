import { type Scopes } from "~/constants";

const cmsAssetBase = "https://cms.greasygang.co/assets";
const contentImages: Record<string, string> = {
	"gg.png": "4d8cc019-09a9-49b0-b5f7-816c754318de",
};
const cmsAssetUrl = (id: string, filename?: string) =>
	`${cmsAssetBase}/${id}${filename ? `/${filename}` : ""}`;

export default defineNuxtPlugin(() => {
	const config = useRuntimeConfig().public;
	const img = useImage();
	const route = useRoute();

	return {
		provide: {
			ogTitle: (title?: string) => `${title ? title + " - " : ""}GreasyGang`,
			login: (providedScopes?: Scopes[], redirect: boolean = true) => {
				const loginURL = new URL(config.apiBase + "/login/twitch");
				const scopes: Scopes[] = providedScopes ?? [];
				if (redirect) loginURL.searchParams.set("redirect", route.fullPath);
				if (!scopes.includes("user:read:email"))
					scopes?.push("user:read:email");
				if (scopes) loginURL.searchParams.set("scopes", scopes.join(" "));

				return loginURL.href;
			},
			cmsImage: (path: string) => cmsAssetUrl(path.replace(/^\/+/, "")),
			ContentImage: (path: string) => {
				const filename = path.replace(/^\/+/, "");
				const assetId = contentImages[filename];

				if (assetId) return cmsAssetUrl(assetId, filename);

				return `/content/image/${config.branch}/website/images/${filename}`;
			},
			PreContentImage: (path: string, width?: number, height?: number) => {
				const { $ContentImage } = useNuxtApp();

				return img($ContentImage(path), { width, height });
			},
			BGContentImage: (
				path: string,
				width?: number,
				height?: number,
				options?: {
					darken: number | boolean;
				}
			) => {
				const { $ContentImage } = useNuxtApp();

				const imgUrl = img($ContentImage(path), { width, height });
				const filters = [];
				if (options?.darken) {
					const amount = `${options.darken === true ? 0.5 : options.darken}`;
					filters.push(
						`linear-gradient(rgba(0, 0, 0, ${amount}), rgba(0, 0, 0, ${amount}))`
					);
				}
				return {
					backgroundImage: `${filters.length > 0 ? filters.join(",") + "," : ""} url('${imgUrl}')`,
				};
			},
		},
	};
});
