// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from '@primeuix/themes/aura'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@element-plus/nuxt',
    '@primevue/nuxt-module',
    '@pinia/nuxt'
  ],

  css: [
    'element-plus/dist/index.css',
    'primeicons/primeicons.css',
    '@vue-flow/core/dist/style.css',
    '@vue-flow/core/dist/theme-default.css',
    '@vue-flow/controls/dist/style.css',
    '@vue-flow/minimap/dist/style.css',
    '@vue-flow/node-resizer/dist/style.css',
    '~/assets/css/main.scss'
  ],

  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.app-dark'
        }
      }
    }
  },

  app: {
    head: {
      title: '端网协同',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },

  vite: {
    server: {
      proxy: {
        // 全部后端路径交给 FastAPI (localhost:8000)
        '/api':    { target: 'http://localhost:8000', changeOrigin: true },
        '/stream': { target: 'http://localhost:8000', changeOrigin: true },
      }
    }
  }
})
