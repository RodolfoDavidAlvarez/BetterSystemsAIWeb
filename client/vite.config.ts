import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { checker } from 'vite-plugin-checker';
import runtimeErrorModal from '@replit/vite-plugin-runtime-error-modal';
import type { Plugin } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: {
        root: path.resolve(__dirname),
        tsconfigPath: path.resolve(__dirname, 'tsconfig.json')
      }
    }) as Plugin,
    runtimeErrorModal() as Plugin
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5181,
    strictPort: false,
    hmr: {
      clientPort: 443,
      protocol: 'wss',
      host: process.env.REPLIT_SLUG ? `${process.env.REPLIT_SLUG}.replit.dev` : 'localhost'
    }
  }
});