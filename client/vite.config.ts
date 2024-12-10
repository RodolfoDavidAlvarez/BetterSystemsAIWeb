import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import checker from "vite-plugin-checker";
import runtimeErrorModal from "@replit/vite-plugin-runtime-error-modal";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

export default defineConfig({
  root: path.resolve(__dirname),
  publicDir: "public",
  base: "/",
  plugins: [
    react(),
    checker({
      typescript: true,
      overlay: false,
      enableBuild: false,
    }) as any,
    runtimeErrorModal(),
    ViteImageOptimizer({
      test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
      exclude: undefined,
      include: undefined,
      includePublic: true,
      logStats: true,
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
    }) as any,
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
    },
    proxy: {
      "/api": {
        target: "http://0.0.0.0:3000",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
    hmr: {
      clientPort: process.env.REPLIT_SLUG ? 443 : undefined,
      host: process.env.REPLIT_SLUG
        ? `${process.env.REPLIT_SLUG}.replit.dev`
        : "localhost",
      protocol: process.env.REPLIT_SLUG ? "wss" : "ws",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development',
    manifest: true,
    assetsDir: "assets",
    copyPublicDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html")
      },
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('wouter')) {
              return 'vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui';
            }
          }
        },
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash][extname]';
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
