export default defineNuxtPlugin(() => {
	const config = useRuntimeConfig().public;
	const img = useImage();

	return {
		provide: {
			ogTitle: (title?: string) => `GreasyGang ${title ? " - " + title : ""}`,
			ContentImage: (path: string) =>
				`${config.apiBase}/image/${config.branch}/website/images/${path}`,
			PreContentImage: (path: string, width?: number, height?: number) => {
				const { $ContentImage } = useNuxtApp();

				return img($ContentImage(path), { width, height });
			},
			BGContentImage: (
				path: string,
				width?: number,
				height?: number,
				options?: {
					darken: number | boolean;
				}
			) => {
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
