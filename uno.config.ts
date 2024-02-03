import {
	defineConfig,
	presetAttributify,
	presetIcons,
	presetTypography,
	presetUno,
	presetWebFonts,
	transformerDirectives,
	transformerVariantGroup,
} from "unocss";

export default defineConfig({
	presets: [
		presetUno({}),
		presetAttributify(),
		presetIcons(),
		presetTypography(),
		presetWebFonts({
			fonts: {
				IBM: "IBM Plex Sans",
			},
		}),
	],
	shortcuts: [
		// ...
	],
	theme: {
		breakpoints: {
			xs: "320px",
			sm: "640px",
			md: "768px",
			lg: "1024px",
			xl: "1280px",
			xxl: "1536px",
			"2xl": "1536px",
		},
		colors: {
			home: {
				button: {
					"": "#ff5454",
					hovered: "#bd3535",
				},
			},
		},
	},
	transformers: [transformerDirectives(), transformerVariantGroup()],
});
