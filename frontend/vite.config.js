import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// PWA del shell: la interfaz abre rápido e instalada. La API no entra en
// la caché (el lector y el celular siguen dependiendo de la red para los
// datos). El aviso de "nueva versión" está en AvisosPwa; no se recarga
// solo, para no cortar una lectura del Zebra a mitad del código.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      filename: 'sw.js',
      manifestFilename: 'manifest.webmanifest',
      manifest: {
        id: '/',
        name: 'FISC-vento',
        short_name: 'FISC-vento',
        description: 'Gestión y captura de activos de la FISC (UTP).',
        lang: 'es',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#041C36',
        theme_color: '#041C36',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [
          /^\/api(\/|$)/,
          /^\/admin(\/|$)/,
          /^\/static\//,
          /^\/\.well-known\//,
        ],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
        runtimeCaching: [
          { urlPattern: /\/api(\/|$)/, handler: 'NetworkOnly' },
          { urlPattern: /\/admin(\/|$)/, handler: 'NetworkOnly' },
          { urlPattern: /\/static\//, handler: 'NetworkOnly' },
        ],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
