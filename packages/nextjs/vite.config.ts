/// <reference types="vitest" />
import { resolve } from 'path';
import { defineConfig } from 'vite';

import dts from '../../shared/src/vite-plugin-dts';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../../shared/src'),
    },
  },
  plugins: [dts()],
  build: {
    lib: {
      entry: [
        resolve(__dirname, 'src/index.ts'),
      ],
      name: '@edge-csrf/nextjs',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['next/server'],
    },
  },
  test: {
    environment: 'edge-runtime',
    globals: true,
  },
});
