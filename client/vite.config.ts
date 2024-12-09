import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import checker from "vite-plugin-checker";
import runtimeErrorModal from "@replit/vite-plugin-runtime-error-modal";
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

export default defineConfig({
  root: './',
  base: '/',
  plugins: [
    react(),
    checker({ 
      typescript: true, 
      overlay: false,
      enableBuild: false 
    }),
    runtimeErrorModal(),
    ViteImageOptimizer({
      jpeg: {
        quality: 85,
        progressive: true,
      },
      jpg: {
        quality: 85,
        progressive: true,
      },
      png: {
        quality: 85,
        progressive: true,
      },
      webp: {
        lossless: true,
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://0.0.0.0:3000',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    },
    hmr: {
      clientPort: process.env.REPLIT_SLUG ? 443 : undefined,
      host: process.env.REPLIT_SLUG ? `${process.env.REPLIT_SLUG}.replit.dev` : undefined,
      protocol: process.env.REPLIT_SLUG ? 'wss' : 'ws'
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../dist/public"),
    sourcemap: false,
    manifest: true,
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'wouter'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      }
    },
    minify: true,
    cssMinify: true,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
});
