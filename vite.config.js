import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/gif.js.optimized/dist/gif.worker.js',
          dest: ''  // 直接丟到根目錄
        }
      ]
    }),
    VitePWA({
      registerType: 'autoUpdate', // 自動更新
      includeAssets: ['pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Photo ToolBox',
        short_name: 'PT',
        description: 'Photo ToolBox',
        theme_color: '#ffffff',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  base: '/vue-photo-toolbox/',
  server: {
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**',
        '**/.idea/**',
        '**/.vscode/**'
      ]
    }
  }
})
