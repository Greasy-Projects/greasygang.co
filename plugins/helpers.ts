import { type Scopes } from "~/constants";
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
			cmsImage: (path: string) => `/cms/assets/${path}`,
			ContentImage: (path: string) =>
				`/content/image/${config.branch}/website/images/${path}`,
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
