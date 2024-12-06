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
    host: true,
    port: 5173,
    hmr: {
      clientPort: 443,
      timeout: 120000
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
});
