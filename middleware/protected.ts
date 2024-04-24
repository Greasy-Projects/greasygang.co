export default defineNuxtRouteMiddleware(async m => {
	const token = useCookie("auth_session").value;
	const config = useRuntimeConfig().public;
	const api = new URL(config.apiBase);
	api.pathname = "/token/validate";

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
	api.searchParams.set("scopes", "user:read:email");
	return navigateTo(api.toString(), {
		external: true,
	});
});
