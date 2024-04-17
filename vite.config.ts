/// <reference types="vitest" />
import typescript from '@rollup/plugin-typescript';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: [
        resolve(__dirname, 'src/index.ts'),
        resolve(__dirname, 'src/nextjs.ts'),
        resolve(__dirname, 'src/sveltekit.ts'),
      ],
      name: 'edge-csrf',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      plugins: [
        typescript({
          sourceMap: false,
          declaration: true,
          outDir: "dist",
          include: ['src/**/*'],
          exclude: ['src/**/*.test.ts'],
        }),
      ],
      external: [/node_modules/],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },  
  test: {
    environment: 'edge-runtime',
    globals: true,
  },
});
