export default defineNuxtPlugin(() => {
	const config = useRuntimeConfig().public;
	const img = useImage();
	const route = useRoute();

	return {
		provide: {
			ogTitle: (title?: string) => `${title ? title + " - " : ""}GreasyGang`,
			login: (providedScopes?: Scopes[], redirect: boolean = true) => {
				const loginURL = new URL(config.apiBase + "/login/twitch");
				const scopes: Scopes[] = [];
				if (redirect) loginURL.searchParams.set("redirect", route.fullPath);
				if (!scopes.includes("user:read:email"))
					scopes?.push("user:read:email");
				if (scopes) loginURL.searchParams.set("scopes", scopes.join(" "));

				return loginURL.href;
			},
			ContentImage: (path: string) =>
				`${config.apiBase}/image/${config.branch}/website/images/${path}`,
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

type Scopes =
	| "analytics:read:extensions"
	| "analytics:read:games"
	| "bits:read"
	| "channel:manage:ads"
	| "channel:read:ads"
	| "channel:manage:broadcast"
	| "channel:read:charity"
	| "channel:edit:commercial"
	| "channel:read:editors"
	| "channel:manage:extensions"
	| "channel:read:goals"
	| "channel:read:guest_star"
	| "channel:manage:guest_star"
	| "channel:read:hype_train"
	| "channel:manage:moderators"
	| "channel:read:polls"
	| "channel:manage:polls"
	| "channel:read:predictions"
	| "channel:manage:predictions"
	| "channel:manage:raids"
	| "channel:read:redemptions"
	| "channel:manage:redemptions"
	| "channel:manage:schedule"
	| "channel:read:stream_key"
	| "channel:read:subscriptions"
	| "channel:manage:videos"
	| "channel:read:vips"
	| "channel:manage:vips"
	| "clips:edit"
	| "moderation:read"
	| "moderator:manage:announcements"
	| "moderator:manage:automod"
	| "moderator:read:automod_settings"
	| "moderator:manage:automod_settings"
	| "moderator:manage:banned_users"
	| "moderator:read:blocked_terms"
	| "moderator:manage:blocked_terms"
	| "moderator:manage:chat_messages"
	| "moderator:read:chat_settings"
	| "moderator:manage:chat_settings"
	| "moderator:read:chatters"
	| "moderator:read:followers"
	| "moderator:read:guest_star"
	| "moderator:manage:guest_star"
	| "moderator:read:shield_mode"
	| "moderator:manage:shield_mode"
	| "moderator:read:shoutouts"
	| "moderator:manage:shoutouts"
	| "moderator:read:unban_requests"
	| "moderator:manage:unban_requests"
	| "user:edit"
	| "user:edit:follows"
	| "user:read:blocked_users"
	| "user:manage:blocked_users"
	| "user:read:broadcast"
	| "user:manage:chat_color"
	| "user:read:email"
	| "user:read:emotes"
	| "user:read:follows"
	| "user:read:moderated_channels"
	| "user:read:subscriptions"
	| "user:manage:whispers";
