import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/tamil-pommai/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'தமிழ் பொம்மை விளையாட்டு',
        short_name: 'Pommai',
        description: 'குரல் கட்டளைகளுடன் குழந்தைகள் விளையாடும் தமிழ் பொம்மை செயலி. (A Tamil voice-activated animation app for kids!)',
        start_url: '/tamil-pommai/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffcc00',
        lang: "ta",
        scope: "/tamil-pommai/",
        id: "/tamil-pommai/",
        orientation: "portrait",
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
  screenshots: [
    {
      src: "screenshot1.png",
      sizes: "540x960",
      type: "image/png"
    },
    {
      src: "screenshot2.png",
      sizes: "540x960",
      type: "image/png"
    }
  ]
      }
    })
  ]
})