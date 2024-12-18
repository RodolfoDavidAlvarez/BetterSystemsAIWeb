
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import checker from "vite-plugin-checker";

export default defineConfig({
  plugins: [
    react(),
    checker({ typescript: true, overlay: false })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@db': path.resolve(__dirname, '..', 'db')
    }
  },
  root: __dirname,
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'wss',
      host: process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co',
      clientPort: 443
    }
  },
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
    sourcemap: true
  }
});
