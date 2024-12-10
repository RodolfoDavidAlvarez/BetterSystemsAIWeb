import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  root: __dirname,
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      clientPort: process.env.REPLIT_SLUG ? 443 : 5173,
      host: process.env.REPLIT_SLUG ? `${process.env.REPLIT_SLUG}.replit.dev` : 'localhost',
      protocol: process.env.REPLIT_SLUG ? 'wss' : 'ws',
      timeout: 30000
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  build: {
    outDir: path.resolve(__dirname, '../dist/public'),
    emptyOutDir: true,
    sourcemap: false,
    minify: mode === 'production',
    target: 'esnext',
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'js': [
            '@radix-ui/react-dialog',
            'class-variance-authority',
            'clsx',
            'tailwind-merge'
          ]
        },
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/js/[name].[hash].js',
        entryFileNames: 'assets/js/[name].[hash].js'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@radix-ui/react-dialog']
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    target: 'esnext'
  }
}));
