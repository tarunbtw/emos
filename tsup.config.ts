import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: ['react', 'react-dom'],
    clean: true,
  },
  {
    entry: { 'emos.umd': 'src/vanilla.ts' },
    format: ['iife'],
    globalName: 'emos',
    outDir: 'dist',
    minify: true,
    sourcemap: false,
  },
])
