import { build } from 'tsup';
import type { Plugin } from 'vite';

export default (): Plugin => ({
  name: 'dts',
  apply: 'build',
  closeBundle: async () => {
    await build({
      entry: ['src/index.ts'],
      outDir: 'dist',
      format: 'esm',
      dts: {
        only: true,
      },
    });
  },
});
