/// <reference types="vitest" />
import typescript from '@rollup/plugin-typescript';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: [
        resolve(__dirname, 'src/index.ts'),
      ],
      name: 'edge-csrf',
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      plugins: [
        typescript({
          sourceMap: false,
          declaration: true,
          outDir: "dist",
          include: ['src/**/*']
        }),
      ],
      external: [],
    },
  },
  test: {
    environment: 'edge-runtime',
    globals: true,
  },
});
