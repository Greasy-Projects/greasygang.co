export default defineNuxtPlugin(() => {
	const config = useRuntimeConfig().public;

	return {
		provide: {
			ContentImage: (path: string) =>
				`${config.apiBase}/image/${config.branch}/website/images/${path}`,
			BGContentImage: (path: string, width?: number, height?: number) => {
				const img = useImage();
				const { $ContentImage } = useNuxtApp();

				const imgUrl = img($ContentImage(path), { width, height });
				return { backgroundImage: `url('${imgUrl}')` };
			},
		},
	};
});
