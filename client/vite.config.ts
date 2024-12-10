
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import checker from "vite-plugin-checker";

export default defineConfig({
  plugins: [
    react(),
    checker({ typescript: true, overlay: false })
  ],
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
      protocol: 'wss',
      host: '0.0.0.0',
      port: 5173,
      clientPort: 443,
      timeout: 120000,
      maxRetries: 10
    }
  },
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
    sourcemap: true,
    assetsDir: 'assets',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: undefined,
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      }
    }
  }
});
