import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8080,
    host: '0.0.0.0', // Listen on all interfaces (localhost and 127.0.0.1)
  },
  build: {
    outDir: 'dist',
  },
  publicDir: 'public',
});
