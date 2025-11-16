import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 🚨 ADD THIS CONFIGURATION BLOCK 🚨
  optimizeDeps: {
    // Exclude heatmap.js from pre-bundling. 
    // This often fixes issues with libraries that conflict with module environments.
    exclude: ['heatmap.js'],
  },
})
