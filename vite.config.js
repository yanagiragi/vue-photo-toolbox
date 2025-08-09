import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteStaticCopy } from 'vite-plugin-static-copy'

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
