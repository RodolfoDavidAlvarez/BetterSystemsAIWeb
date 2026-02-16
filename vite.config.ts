import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import checker from "vite-plugin-checker";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import path from "path";

/**
 * DEVELOPMENT PORT CONFIGURATION
 * ==============================
 * - Vite runs on port 5173 (this is your entry point)
 * - Express API runs on port 3001
 * - All /api/* requests are proxied from 5173 -> 3001
 *
 * ALWAYS access the app at: http://localhost:5173
 * NEVER access port 3001 directly in the browser
 */

export default defineConfig({
  plugins: [react(), checker({ typescript: true, overlay: false }), runtimeErrorOverlay(), themePlugin()],
  resolve: {
    alias: {
      "@": path.resolve("./client/src"),
      "@db": path.resolve("./db"),
    },
  },
  root: "./client",
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        secure: false,
      },
    },
    hmr: {
      host: "localhost",
    },
  },
});
