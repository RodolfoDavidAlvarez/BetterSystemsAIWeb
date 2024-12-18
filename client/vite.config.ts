
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
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    watch: {
      usePolling: true
    },
    hmr: {
      clientPort: 443,
      protocol: 'wss',
      host: process.env.REPL_SLUG ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'localhost'
    }
  },
  build: {
    sourcemap: true,
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  }
});
