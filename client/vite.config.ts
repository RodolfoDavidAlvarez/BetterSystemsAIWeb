import { defineConfig } from 'vite'
// We're running without the React plugin for now
// import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    hmr: {
      clientPort: 443,
      host: '0.0.0.0',
    },
    proxy: {
      '/api': {
        target: 'http://0.0.0.0:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
    sourcemap: true
  },
  css: {
    // Comment out the PostCSS config for now
    // postcss: {
    //   plugins: [
    //     require('autoprefixer'),
    //     require('tailwindcss'),
    //   ],
    // },
  },
})