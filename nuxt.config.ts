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
    "@nuxt/image"
  ],
  googleFonts: {
    families: { "IBM Plex Sans": true },
    preload: true,
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
