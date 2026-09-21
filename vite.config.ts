import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  envPrefix: ['VITE_', 'SUWAYOMI_'],
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Mari',
        short_name: 'Mari',
        description: 'A Suwayomi manga reader client',
        theme_color: '#1d232a',
        background_color: '#1d232a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/favicon-16x16.png',   sizes: '16x16',   type: 'image/png' },
          { src: '/icons/favicon-24x24.png',   sizes: '24x24',   type: 'image/png' },
          { src: '/icons/favicon-32x32.png',   sizes: '32x32',   type: 'image/png' },
          { src: '/icons/favicon-48x48.png',   sizes: '48x48',   type: 'image/png' },
          { src: '/icons/favicon-57x57.png',   sizes: '57x57',   type: 'image/png' },
          { src: '/icons/favicon-60x60.png',   sizes: '60x60',   type: 'image/png' },
          { src: '/icons/favicon-64x64.png',   sizes: '64x64',   type: 'image/png' },
          { src: '/icons/favicon-70x70.png',   sizes: '70x70',   type: 'image/png' },
          { src: '/icons/favicon-72x72.png',   sizes: '72x72',   type: 'image/png' },
          { src: '/icons/favicon-76x76.png',   sizes: '76x76',   type: 'image/png' },
          { src: '/icons/favicon-96x96.png',   sizes: '96x96',   type: 'image/png' },
          { src: '/icons/favicon-114x114.png', sizes: '114x114', type: 'image/png' },
          { src: '/icons/favicon-120x120.png', sizes: '120x120', type: 'image/png' },
          { src: '/icons/favicon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/favicon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icons/favicon-150x150.png', sizes: '150x150', type: 'image/png' },
          { src: '/icons/favicon-152x152.png', sizes: '152x152', type: 'image/png' },
          { src: '/icons/favicon-180x180.png', sizes: '180x180', type: 'image/png' },
          { src: '/icons/favicon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/favicon-196x196.png', sizes: '196x196', type: 'image/png' },
          { src: '/icons/favicon-310x310.png', sizes: '310x310', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Cache manga page images from the API
            urlPattern: ({ url }) => url.pathname.includes('/api/') && url.pathname.includes('/page/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'manga-pages-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache manga thumbnails
            urlPattern: ({ url }) => url.pathname.includes('/thumbnail'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'manga-thumbnails-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache API responses (manga lists, chapter lists) — network first, fallback to cache
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
});
