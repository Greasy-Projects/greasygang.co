export default defineNuxtPlugin(() => {
	const config = useRuntimeConfig().public;

	return {
		provide: {
			ContentImage: (path: string) =>
				`${config.apiBase}/image/${config.branch}/website/images/${path}`,
		},
	};
});
