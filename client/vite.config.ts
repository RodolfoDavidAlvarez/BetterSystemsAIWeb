import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import checker from 'vite-plugin-checker';
import type { PluginOption } from 'vite';

export default defineConfig({
  plugins: [
    react() as PluginOption,
    checker({ typescript: true, overlay: false }) as PluginOption
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@db': path.resolve(__dirname, '..', 'db')
    }
  },
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      host: process.env.REPLIT_SLUG ? `${process.env.REPLIT_SLUG}.replit.dev` : 'localhost',
      port: 443,
      clientPort: 443,
      protocol: 'wss'
    }
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  preview: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true
  }
});