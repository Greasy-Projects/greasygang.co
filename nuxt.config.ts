// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: true },
	fonts: {},
	// googleFonts: {
	// 	families: { "IBM Plex Sans": true, "Bebas Neue": true, Poppins: true },
	// 	preload: true,
	// },
	routeRules: {
		"/scopes": { robots: "noindex" },
		"/login": { robots: "noindex" },
	},
	css: [
		"@unocss/reset/normalize.css",
		"@unocss/reset/sanitize/sanitize.css",
		"@unocss/reset/sanitize/assets.css",
		"@unocss/reset/eric-meyer.css",
		"@fortawesome/fontawesome-svg-core/styles.css",
		"notivue/notifications.css",
		"notivue/animations.css",
	],
	modules: [
		"@unocss/nuxt",
		"@nuxtjs/google-fonts",
		"@nuxt/image",
		"nuxt-graphql-client",
		"notivue/nuxt",
		"nuxt-build-cache",
		"@nuxtjs/seo",
		"@nuxt/fonts",
	],
	site: {
		url: "https://greasygang.co",
		name: "GreasyGang",
		description: "Welcome to the Greasy Gang!",
		defaultLocale: "en",
	},
	notivue: { limit: 4, enqueue: true, position: "bottom-right" },
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
		watch: true,
		codegen: {
			disableOnBuild: true,
		},
	},
	image: {
		domains: [
			process.env.API_BASE?.replace(/(^\w+:|^)\/\//, "") ?? "",
			"cms.greasygang.co",
		],
		alias: {
			content: process.env.API_BASE ?? "",
			cms: "https://cms.greasygang.co",
		},
		quality: 90,
		densities: [1, 2],
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
	build: {
		transpile: [
			"@fortawesome/fontawesome-svg-core",
			"@fortawesome/vue-fontawesome",
			"@fortawesome/free-solid-svg-icons",
			"@fortawesome/free-brands-svg-icons",
		],
	},
	experimental: {
		viewTransition: true,
	},
	compatibilityDate: "2024-09-18",
});
