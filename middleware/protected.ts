export default defineNuxtRouteMiddleware(async () => {
	const { data } = await useFetch("/api/auth/user");
    if (!data.value) {
      return navigateTo("/login/twitch");
    }
});