import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    host: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5005',
        changeOrigin: true,
        secure: false
      }
    }
  },
  optimizeDeps: {
    rolldownOptions: {}
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress warnings during build
      }
    }
  }
})
