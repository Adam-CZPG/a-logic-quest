import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import pkg from './package.json' with { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  // relative paths so the same build works on any static host and inside the Android app
  base: './',
  plugins: [react()],
  define: { 'import.meta.env.APP_VERSION': JSON.stringify(pkg.version) },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
