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
				bebas: "Bebas Neue",
				poppins: "poppins",
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
			primary: "#e8a946",
			secondary: "#fa4040",
			button: "#de3535",
		},
	},
	transformers: [transformerDirectives(), transformerVariantGroup()],
});
