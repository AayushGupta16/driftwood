import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        dashboard: 'dashboard.html',
        admin: 'admin.html',
      },
    },
  },
  server: {
    proxy: {
      '/auth': { target: 'http://localhost:8000', changeOrigin: true },
      '/linkedin': { target: 'http://localhost:8000', changeOrigin: true },
      '/email': { target: 'http://localhost:8000', changeOrigin: true },
      '/twitter': { target: 'http://localhost:8000', changeOrigin: true },
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
