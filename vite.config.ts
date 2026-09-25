import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: ['**/android/**', '**/ios/**'],
    },
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0,
  },
  worker: {
    format: 'es',
  },
});
