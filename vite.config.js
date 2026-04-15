import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const processPolyfill = {
  name: 'process-polyfill',
  renderChunk(code) {
    return `if(typeof window!=="undefined"&&!window.process){window.process={env:{NODE_ENV:"production"},emit:function(){}}}\n${code}`;
  },
};

export default defineConfig({
  plugins: [react(), processPolyfill],
  build: {
    rollupOptions: {
      input: 'src/entry.js',
      output: {
        format: 'iife',
        name: 'RockScene',
        entryFileNames: 'rock-scene.js',
        inlineDynamicImports: true,
        assetFileNames: 'rock-scene.[ext]',
      },
    },
    cssCodeSplit: false,
  },
})
