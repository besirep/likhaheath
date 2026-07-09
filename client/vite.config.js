import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Output the production build directly into the Express server's public folder.
    // This lets Express serve the app on a single port (5000) without needing
    // a separate Vite preview server in production.
    outDir: '../server/public',
    emptyOutDir: true,
  },
})
