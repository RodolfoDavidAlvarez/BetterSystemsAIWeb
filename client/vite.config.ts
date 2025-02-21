import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import themePlugin from "@replit/vite-plugin-shadcn-theme-json"

export default defineConfig({
  plugins: [
    react(),
    themePlugin({
      path: path.resolve(__dirname, 'theme.json')
    })
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
    hmr: {
      clientPort: 443,
      protocol: 'wss',
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
})