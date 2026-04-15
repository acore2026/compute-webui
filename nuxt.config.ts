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
        // 显式列出走 FastAPI 的路径，/api/topology 由 Nuxt Nitro 自己的 server/api 处理
        '/api/logs':    { target: 'http://localhost:8000', changeOrigin: true },
        '/api/metrics': { target: 'http://localhost:8000', changeOrigin: true },
        '/api/v1':      { target: 'http://localhost:8000', changeOrigin: true },
        '/api/stage':   { target: 'http://localhost:8000', changeOrigin: true },
        '/api/webrtc':  { target: 'http://localhost:8000', changeOrigin: true },
        '/stream':      { target: 'http://localhost:8000', changeOrigin: true },
      }
    }
  }
})
