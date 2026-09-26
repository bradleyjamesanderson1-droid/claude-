import { defineConfig } from 'vite';

// base './' keeps the build relocatable (GitHub Pages, itch.io, any static host).
export default defineConfig({
  base: './',
  build: { target: 'es2020', chunkSizeWarningLimit: 2000 },
});
