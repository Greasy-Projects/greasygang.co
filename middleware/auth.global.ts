export default defineNuxtRouteMiddleware(async () => {
	const user = useUser();
	user.value = await ($fetch as (url: string) => Promise<any>)(
		"/api/auth/user"
	);
});
