
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import checker from "vite-plugin-checker";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    checker({ typescript: true, overlay: false }),
    runtimeErrorOverlay(),
    themePlugin(),
  ],
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
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    hmr: {
      clientPort: 443
    }
  }
});
