import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/main.jsx',
      name: 'RockScene',
      fileName: 'rock-scene',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        // single file, no code splitting
        inlineDynamicImports: true,
      },
    },
  },
})
