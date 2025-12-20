import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Add a dev proxy to avoid CORS when calling the FPL API from the browser.
// Requests starting with `/api` will be forwarded to the FPL host. 
export default defineConfig({
  base: '/FPLAICompanion/',  // Add this line - must match your repo name
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://fantasy.premierleague.com',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})
