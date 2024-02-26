export default defineNuxtRouteMiddleware(async m => {
	const config = useRuntimeConfig().public;
	const token = useCookie("auth_session").value;

	const api = new URL(config.apiBase);
	api.pathname = "/validate/role";
	if (token) {
		const role = await useFetch(api.toString(), {
			headers: {
				authorization: token,
			},
		});

		console.log(role.data.value);
		if (role.status.value === "success" && role.data.value == "developer") return;
	}

	return navigateTo("/dashboard");
});
