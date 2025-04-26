import { defineConfig } from 'rollup';
import dts from 'rollup-plugin-dts';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default defineConfig([
  {
    input: './dist/index.d.ts',
    output: {
      file: './dist/index.bundled.d.ts',
      format: 'es',
    },
    plugins: [nodeResolve(), dts()],
    external: [/node_modules/],
  },
]);
