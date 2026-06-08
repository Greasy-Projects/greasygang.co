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
			cream: "#fff2c8",
			ink: "#25120e",
			mustard: "#e8a946",
			pickle: "#2f7f67",
			night: "#0f0805",
		},
		fontFamily: {
			bebas: ['"Bebas Neue"', 'Impact', 'sans-serif'],
			poppins: ['Poppins', 'sans-serif'],
		},
	},
	transformers: [transformerDirectives(), transformerVariantGroup()],
});
