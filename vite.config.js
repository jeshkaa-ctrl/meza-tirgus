import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { acmValidetToken } from './src/utils/acm.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    server: {
      host: true,
      proxy: {
        '/api/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              const token  = req.headers['x-acm-token'] || ''
              const sesija = req.headers['x-sesija-id'] || ''

              if (!acmValidetToken(token, sesija)) {
                console.warn('[ACM] 🐗 Bloķēts pieprasījums —', req.socket?.remoteAddress)
                res.writeHead(403, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'ACM_BLOCKED' }))
                return
              }

              proxyReq.setHeader('x-api-key', (env.ANTHROPIC_KEY || '').trim())
              proxyReq.setHeader('anthropic-version', '2023-06-01')
              proxyReq.removeHeader('origin')
              proxyReq.removeHeader('referer')
              proxyReq.removeHeader('accept-encoding')
              proxyReq.removeHeader('x-acm-token')
              proxyReq.removeHeader('x-sesija-id')
            })
          },
        }
      }
    },
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: {
            'pdf-worker': ['pdfjs-dist'],
            'supabase':   ['@supabase/supabase-js'],
            'react-core': ['react', 'react-dom'],
          }
        }
      }
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
        manifest: {
          name: 'Meža Tirgus',
          short_name: 'MežaTirgus',
          description: 'Meža vērtēšanas un cirsmu aprēķinu rīks',
          theme_color: '#225522',
          background_color: '#0f1117',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst'
            }
          ]
        }
      })
    ],
  }
})
