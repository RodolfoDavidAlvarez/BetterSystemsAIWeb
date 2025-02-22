import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import checker from "vite-plugin-checker"

export default defineConfig({
  plugins: [
    react(),
    checker({ typescript: true, overlay: false }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: true
  },
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
    sourcemap: true
  }
})