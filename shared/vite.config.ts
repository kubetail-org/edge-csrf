/// <reference types="vitest" />
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../../shared/src'),
    },
  },
  test: {
    environment: 'edge-runtime',
    globals: true,
  },
});
