import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use automatic JSX transform
      jsxRuntime: 'automatic',
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 443,
      protocol: 'wss',
      host: process.env.REPLIT_SLUG ? `${process.env.REPLIT_SLUG}.replit.dev` : 'localhost'
    }
  },
  // Add better error handling and debugging
  build: {
    sourcemap: true,
    outDir: 'dist',
    assetsDir: 'assets'
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    force: true
  }
});