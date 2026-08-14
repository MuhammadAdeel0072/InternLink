import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'localhost',
    // Proxy /api requests to the backend during development so the Vite dev
    // server acts as a single entry point. This avoids CORS preflight issues
    // and the ERR_CONNECTION_REFUSED errors when the browser's dev tools
    // try to reach the API directly.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      // Proxy Socket.IO WebSocket upgrade requests to the backend.
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
    // Retry connection gracefully if the dev server temporarily disconnects
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      overlay: false,
    },
  },
})
