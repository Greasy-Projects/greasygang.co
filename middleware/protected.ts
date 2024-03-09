export default defineNuxtRouteMiddleware(async m => {
	const token = useCookie("auth_session").value;
	//TODO: validate token and handle accordingly
	const config = useRuntimeConfig().public;
	const api = new URL(config.apiBase);
	api.pathname = "/token/validate";
	console.log(m.fullPath);

	if (token) {
		const validate = await useFetch(api.toString(), {
			headers: {
				authorization: token,
			},
		});
		if (validate.status.value === "success") return;
	}

	api.pathname = "/login/twitch";
	api.searchParams.set("token_callback", config.callbackUrl);
	api.searchParams.set("redirect", m.fullPath);
	//TODO: allow dynamic scopes depending on the pages needs
	api.searchParams.set(
		"scopes",
		"bits:read channel:read:editors channel:read:redemptions channel:read:subscriptions user:read:email"
	);
	return navigateTo(api.toString(), {
		external: true,
	});
});
