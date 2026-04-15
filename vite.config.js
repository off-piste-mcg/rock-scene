import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'public/models/*', dest: 'models' },
        { src: 'public/textures/*', dest: 'textures' },
      ],
    }),
  ],
  build: {
    lib: {
      entry: 'src/main.jsx',
      name: 'RockScene',
      fileName: 'rock-scene',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
