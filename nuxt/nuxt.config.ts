// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: "Re:ポケベル",
      htmlAttrs: {
        lang: "ja",
      },
      link: [
        { rel: "icon", type: "image/png", href: "/favicon.png" },
      ],
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
      theme_color: "#5BA3D0",
      icons: [
        {
          src: "/favicon.png",
          sizes: "1024x1024",
          type: "image/png",
        },
      ],
    },
  },
});
