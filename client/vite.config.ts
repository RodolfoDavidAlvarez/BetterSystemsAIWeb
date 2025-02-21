import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Read server port from environment or default to 8080
const serverPort = process.env.SERVER_PORT || '8080';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    hmr: {
      host: process.env.REPL_SLUG + "." + process.env.REPL_OWNER + ".repl.co",
      clientPort: 443,
      protocol: 'wss'
    },
    proxy: {
      '/api': {
        target: `http://0.0.0.0:${serverPort}`,
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});