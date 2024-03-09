export default defineNuxtPlugin(() => {
	const config = useRuntimeConfig().public;

	return {
		provide: {
			ContentImage: (path: string) =>
				`https://raw.githubusercontent.com/Greasy-Projects/content/${config.branch}/website/images/${path}`,
		},
	};
});
