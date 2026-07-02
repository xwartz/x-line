import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'http'
import path from 'path'
import { pathToFileURL } from 'url'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

interface LocalApiRequest extends IncomingMessage {
  originalUrl?: string
  query?: Record<string, string>
}

interface LocalApiResponse extends ServerResponse {
  status: (code: number) => LocalApiResponse
  json: (payload: unknown) => void
}

function localTweetsApi(): Plugin {
  return {
    name: 'x-line-local-tweets-api',
    configureServer(server) {
      server.middlewares.use('/api/tweets', async (request, response) => {
        const handlerUrl = pathToFileURL(
          path.resolve(__dirname, 'api/tweets.js')
        ).href
        const { default: tweetsHandler } = await import(handlerUrl)
        const requestUrl = request.originalUrl || request.url || ''
        const url = new URL(requestUrl, 'http://localhost')
        const localRequest = request as LocalApiRequest
        const localResponse = response as LocalApiResponse

        localRequest.query = Object.fromEntries(url.searchParams)
        localResponse.status = code => {
          localResponse.statusCode = code
          return localResponse
        }
        localResponse.json = payload => {
          localResponse.setHeader('Content-Type', 'application/json')
          localResponse.end(JSON.stringify(payload))
        }

        await tweetsHandler(localRequest, localResponse)
      })
    }
  }
}

export default defineConfig({
  plugins: [
    localTweetsApi(),
    react(),
    VitePWA({
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
      },
      devOptions: {
        enabled: true
      }
    })
  ],
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
