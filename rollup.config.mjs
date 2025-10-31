import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const input = 'src/index.js';
const external = ['maplibre-gl'];
const globals = { 'maplibre-gl': 'maplibregl' };

export default [
  // ESM and CJS builds
  {
    input,
    external,
    plugins: [
      resolve({ browser: true }),
      commonjs()
    ],
    output: [
      { file: 'dist/screengrid.mjs', format: 'es', sourcemap: true },
      { file: 'dist/screengrid.cjs', format: 'cjs', sourcemap: true, exports: 'named' }
    ]
  },
  // UMD build (unminified)
  {
    input,
    external,
    plugins: [
      resolve({ browser: true }),
      commonjs()
    ],
    output: [
      { file: 'dist/screengrid.umd.js', format: 'umd', name: 'ScreenGrid', sourcemap: true, globals }
    ]
  },
  // UMD build (minified)
  {
    input,
    external,
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      terser()
    ],
    output: [
      { file: 'dist/screengrid.umd.min.js', format: 'umd', name: 'ScreenGrid', sourcemap: true, globals }
    ]
  }
];


