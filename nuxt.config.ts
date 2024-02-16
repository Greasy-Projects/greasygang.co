// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	css: [
		"@unocss/reset/normalize.css",
		"@unocss/reset/sanitize/sanitize.css",
		"@unocss/reset/sanitize/assets.css",
		"@unocss/reset/eric-meyer.css",
		"@fortawesome/fontawesome-svg-core/styles.css",
	],
	devtools: { enabled: true },
	modules: [
		"@unocss/nuxt",
		"@nuxtjs/google-fonts",
		"@nuxt/image",
		"nuxt-graphql-client",
	],
	googleFonts: {
		families: { "IBM Plex Sans": true },
		preload: true,
	},
	runtimeConfig: {
		public: {
			apiBase: process.env.API_BASE,
			callbackUrl: process.env.CALLBACK_URL,
		},
	},
	"graphql-client": {
		tokenStorage: {
			name: "auth_session",
			mode: "cookie",
			cookieOptions: {
				path: "/",
				secure: false, // defaults to `process.env.NODE_ENV === 'production'`
				httpOnly: false, // Only accessible via HTTP(S)
				maxAge: 60 * 60 * 24 * 5, // 5 days
			},
		},
	},
	image: {
		quality: 80,
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
