import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  server: {
    port: 5001,
    strictPort: true,
    hmr: {
      port: 5001,
    },
    cors: true,
  },
  build: {
    rollupOptions: {
      input: {
        popup: 'index.html',
        auth: 'auth.html',
      },
    },
  },
});