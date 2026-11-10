import { defineConfig } from 'vite';

export default defineConfig({
  base: '/woool-survivor-game/',
  clearScreen: false,
  server: {
    port: 5174,
    host: '127.0.0.1'
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
          react: ['react', 'react-dom']
        }
      }
    }
  }
});
