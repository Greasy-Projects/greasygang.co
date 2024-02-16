export default defineNuxtRouteMiddleware(async m => {
	const token = useCookie("auth_session", {
		watch: true,
	});
	//TODO: validate token and handle accordingly
	const config = useRuntimeConfig().public;
	if (!token.value) {
		const url = new URL(config.apiBase);
		url.pathname = "/login/twitch";
		url.searchParams.set("token_callback", config.callbackUrl);
		url.searchParams.set("redirect", m.fullPath);
		//TODO: allow dynamic scopes depending on the pages needs
		url.searchParams.set(
			"scopes",
			"bits:read channel:read:editors channel:read:redemptions channel:read:subscriptions user:read:email"
		);
		return navigateTo(url.toString(), {
			external: true,
		});
	}

	useGqlHeaders({ authorization: `Bearer ${token.value}` });
});
