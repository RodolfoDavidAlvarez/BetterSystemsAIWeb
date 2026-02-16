import { defineConfig } from "vite";
// We're running without the React plugin for now
// import react from '@vitejs/plugin-react'
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    hmr: {
      host: "localhost",
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        secure: false,
      },
    },
    // Allow all hosts
    fs: {
      allow: ["."],
    },
    cors: true,
    // Disable the host check to allow all hosts
    origin: "*",
    // Explicitly allow all hosts
    allowedHosts: ["localhost", "127.0.0.1", "0.0.0.0", ".replit.dev", ".worf.replit.dev", "*.replit.dev", "*.worf.replit.dev"],
  },
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
    sourcemap: true,
  },
  css: {
    // Comment out the PostCSS config for now
    // postcss: {
    //   plugins: [
    //     require('autoprefixer'),
    //     require('tailwindcss'),
    //   ],
    // },
  },
});
