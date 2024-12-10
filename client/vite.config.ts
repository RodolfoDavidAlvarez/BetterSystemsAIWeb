
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import checker from "vite-plugin-checker";
import type { PluginOption } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    checker({ typescript: true, overlay: false })
  ] as PluginOption[],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@db": path.resolve(__dirname, "..", "db"),
    },
  },
  root: __dirname,
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 443
    }
  },
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    cssCodeSplit: false,
    modulePreload: {
      polyfill: true
    },
    terserOptions: {
      compress: {
        drop_console: true,
        passes: 3,
        pure_getters: true,
        unsafe: true
      },
      mangle: {
        properties: false
      },
      format: {
        comments: false,
        ecma: 2020
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'wouter', '@radix-ui/react-dialog', 'framer-motion'],
          styles: ['./src/index.css']
        },
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name?.split('.').pop();
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType || '')) {
            return `assets/images/[name].[hash][extname]`;
          }
          if (/css/i.test(extType || '')) {
            return 'assets/css/styles.[hash].css';
          }
          return `assets/[name].[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name].[hash].js',
        entryFileNames: 'assets/js/[name].[hash].js'
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'wouter', '@radix-ui/react-dialog', 'framer-motion'],
    exclude: []
  }
});
