import { defineConfig } from 'rollup';
import dts from 'rollup-plugin-dts';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default defineConfig([
  // Output bundled declaration files
  {
    input: './dist/index.d.ts',
    output: {
      file: './dist/index.bundled.d.ts',
      format: 'es'
    },
    plugins: [
      nodeResolve(),
      dts()
    ],
    external: [
      // Add external dependencies here if needed
      /node_modules/
    ]
  }
]); 