// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: "Re:ポケベル",
      htmlAttrs: {
        lang: "ja",
      },
    },
  },
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/ui", "@vite-pwa/nuxt"],
  css: ["~/assets/css/main.css"],
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "Re:ポケベル",
      short_name: "Re:ポケベル",
      theme_color: "#ffffff",
      icons: [],
    },
  },
});
