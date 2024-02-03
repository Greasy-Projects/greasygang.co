export default defineNuxtRouteMiddleware(async () => {
    // if (process.server) return;
    const { data } = await useFetch("/api/auth/user");
    if (!data.value) {
      return navigateTo("/login/twitch");
    }
  });