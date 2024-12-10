import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import checker from "vite-plugin-checker";
import runtimeErrorModal from "@replit/vite-plugin-runtime-error-modal";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(__dirname, "client"), // Set "client" as the root directory
  publicDir: path.resolve(__dirname, "client/public"), // Public assets directory
  base: process.env.NODE_ENV === "production" ? "/" : "",
  plugins: [
    react(),
    checker({
      typescript: true,
      overlay: false,
      enableBuild: false,
    }),
    runtimeErrorModal(),
    ViteImageOptimizer({
      test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
      includePublic: true,
      logStats: true,
      jpeg: { quality: 85, progressive: true },
      jpg: { quality: 85, progressive: true },
      png: { quality: 85, progressive: true },
      webp: { lossless: true },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: { usePolling: true },
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
      "@": path.resolve(__dirname, "client/src"), // Alias for "client/src"
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist"), // Output directory for built files
    emptyOutDir: true,
    sourcemap: true,
    manifest: true,
    assetsDir: "assets",
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, "client/index.html"), // Entry point for the app
      },
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "wouter"],
          ui: [
            "@radix-ui/react-accordion",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-slot",
          ],
          utils: ["class-variance-authority", "clsx", "tailwind-merge"],
        },
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return "assets/[name]-[hash][extname]";
          const ext = assetInfo.name.split(".").pop();
          return /png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || "")
            ? `assets/images/[name]-[hash][extname]`
            : `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
      },
    },
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === "production",
        drop_debugger: process.env.NODE_ENV === "production",
      },
    },
  },
});
