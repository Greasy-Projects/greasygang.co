export default defineNuxtPlugin(() => {
	const config = useRuntimeConfig().public;

	return {
		provide: {
			ContentImage: (path: string) =>
				`${config.apiBase}/image/${config.branch}/website/images/${path}`,
			BGContentImage: (
				path: string,
				width?: number,
				height?: number,
				options?: {
					darken: number | boolean;
				}
			) => {
				const img = useImage();
				const { $ContentImage } = useNuxtApp();

				const imgUrl = img($ContentImage(path), { width, height });
				const filters = [];
				if (options?.darken) {
					const amount = `${options.darken === true ? 0.5 : options.darken}`;
					filters.push(
						`linear-gradient(rgba(0, 0, 0, ${amount}), rgba(0, 0, 0, ${amount}))`
					);
				}
				return {
					backgroundImage: `${filters.length > 0 ? filters.join(",") + "," : ""} url('${imgUrl}')`,
				};
			},
		},
	};
});
