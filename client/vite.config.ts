import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  base: '/',
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      },
      format: {
        comments: false
      }
    },
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react-vendor';
            if (id.includes('@radix-ui')) return 'ui-vendor';
            return 'vendor';
          }
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name].[hash][extname]`;
          }
          return `assets/[name].[hash][extname]`;
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        compact: true
      }
    },
    chunkSizeWarningLimit: 2000,
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    modulePreload: {
      polyfill: false
    },
    reportCompressedSize: false,
    target: 'esnext'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      timeout: 10000,
      overlay: true,
      clientPort: 5173
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  preview: {
    port: 5173,
    strictPort: true,
    host: '0.0.0.0'
  }
});
