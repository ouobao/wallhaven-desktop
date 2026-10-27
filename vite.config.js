import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    watch: {
      // release/ 是 electron-builder 的输出目录，构建时会不断写入临时文件，
      // 让 Vite 监听它会触发 EBUSY 直接崩溃
      ignored: ['**/release/**', '**/dist/**', '**/node_modules/**']
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
