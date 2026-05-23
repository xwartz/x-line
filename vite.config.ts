import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: [
      'favicon.svg',
      'favicon-16x16.png',
      'favicon-32x32.png',
      'apple-touch-icon.png',
      'mask-icon.svg',
      'pwa-icon.svg',
      'pwa-icon-maskable.svg',
      'web-app-manifest-192x192.png',
      'web-app-manifest-512x512.png',
      'web-app-manifest-512x512-maskable.png'
    ],
    manifest: {
      name: 'X-Line',
      short_name: 'X-Line',
      description: '简洁的 X 关注流',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      lang: 'zh-CN',
      icons: [
        {
          src: 'web-app-manifest-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: 'web-app-manifest-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: 'web-app-manifest-512x512-maskable.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,ico,png,json}'],
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/pbs\.twimg\.com\/.*$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'tweet-media',
            expiration: {
              maxEntries: 240,
              maxAgeSeconds: 60 * 60 * 24 * 14
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /^https:\/\/abs\.twimg\.com\/.*$/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'twitter-assets',
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    }
  }), cloudflare()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})