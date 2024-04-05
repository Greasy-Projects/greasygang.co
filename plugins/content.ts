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
			BGContentImageDarken: (path: string, width?: number, height?: number, darken?: number) => {
				const img = useImage();
				const { $ContentImage } = useNuxtApp();

				const imgUrl = img($ContentImage(path), { width, height });
				return {
					backgroundImage: `linear-gradient(rgba(0, 0, 0, ${darken ?? 0.5}), rgba(0, 0, 0, ${darken ?? 0.5})), url('${imgUrl}')`,
				};
			}
		},
	};
});
