
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
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: false
  }
});
