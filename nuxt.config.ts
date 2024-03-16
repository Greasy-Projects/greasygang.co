// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	css: [
		"@unocss/reset/normalize.css",
		"@unocss/reset/sanitize/sanitize.css",
		"@unocss/reset/sanitize/assets.css",
		"@unocss/reset/eric-meyer.css",
		"@fortawesome/fontawesome-svg-core/styles.css",
		"notivue/notifications.css",
		"notivue/animations.css",
	],
	devtools: { enabled: true },
	build: {
		transpile: [
			"@fortawesome/fontawesome-svg-core",
			"@fortawesome/vue-fontawesome",
			"@fortawesome/free-solid-svg-icons",
			"@fortawesome/free-brands-svg-icons",
		],
	},
	modules: [
		"@unocss/nuxt",
		"@nuxtjs/google-fonts",
		"@nuxt/image",
		"nuxt-graphql-client",
		"notivue/nuxt",
	],
	notivue: { limit: 4, enqueue: true, position: "bottom-right" },
	googleFonts: {
		families: { "IBM Plex Sans": true, "Bebas Neue": true, Poppins: true },
		preload: true,
	},
	runtimeConfig: {
		public: {
			apiBase: process.env.API_BASE,
			callbackUrl: process.env.CALLBACK_URL,
			env: process.env.NODE_ENV || "development",
			branch: process.env.CONTENT_BRANCH ?? "main",
		},
	},
	"graphql-client": {
		tokenStorage: {
			name: "auth_session",
			mode: "cookie",
		},
		codegen: {
			disableOnBuild: true,
		},
	},
	image: {
		domains: [process.env.API_BASE ?? ""],
		quality: 100,
		screens: {
			xs: 320,
			sm: 640,
			md: 768,
			lg: 1024,
			xl: 1280,
			xxl: 1536,
			"2xl": 1536,
		},
	},
});
