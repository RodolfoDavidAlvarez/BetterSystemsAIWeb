import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import checker from "vite-plugin-checker";
import runtimeErrorModal from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    checker({ 
      typescript: true, 
      overlay: false,
      enableBuild: false 
    }),
    runtimeErrorModal()
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    },
    hmr: {
      clientPort: process.env.REPLIT_SLUG ? 443 : undefined,
      host: process.env.REPLIT_SLUG ? `${process.env.REPLIT_SLUG}.replit.dev` : undefined,
      protocol: process.env.REPLIT_SLUG ? 'wss' : undefined
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../dist/public"),
    sourcemap: process.env.NODE_ENV === 'development',
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'wouter'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
});
