import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: ".", // Relative to client directory
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      clientPort: process.env.REPLIT_SLUG ? 443 : 5173,
      host: process.env.REPLIT_SLUG ? `${process.env.REPLIT_SLUG}.replit.dev` : 'localhost',
      protocol: process.env.REPLIT_SLUG ? 'wss' : 'ws',
    }
  },
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});
