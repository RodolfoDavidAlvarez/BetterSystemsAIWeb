import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// IMPORTANT: DO NOT DELETE THESE COMMENTS - Critical configuration information
// Port Configuration:
// - Client dev server must run on port 5173 to match workflow configuration
// - HMR uses wss protocol and port 443 for Replit environment
// - Server proxy must point to the correct backend port (5000)
// 
// Common Issues:
// 1. Port conflicts: If 5173 is unavailable, the client won't start
// 2. Proxy misconfiguration: Wrong target port will break API calls
// 3. Host setting: Must be "0.0.0.0" to be accessible in Replit

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
      clientPort: 443,
      protocol: 'wss',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
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