import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // Enable minification with esbuild (faster and more reliable)
    minify: 'esbuild',

    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'yup'],
        },
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,

    // Source maps for debugging (disable in production if needed)
    sourcemap: false,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
    ],
  },

  // Server config for development
  server: {
    port: 5173,
    strictPort: false,
    open: false,
  },
})
