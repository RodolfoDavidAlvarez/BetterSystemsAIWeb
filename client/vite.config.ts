
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import checker from "vite-plugin-checker";
import type { PluginOption } from 'vite';

export default defineConfig({
  plugins: [
    react() as PluginOption,
    checker({ typescript: true, overlay: false }) as PluginOption
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@db': path.resolve(__dirname, '..', 'db')
    }
  },
  server: {
    host: true,
    strictPort: true,
    port: 5173,
    hmr: {
      clientPort: 443,
      path: '/@vite/client',
      timeout: 5000
    }
  }
});
