import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/index.ts'],
  outDir: './build',
  clean: true,
  format: 'esm',
  dts: {
    resolve: true,
  },
  target: 'es2015',
  sourcemap: true,
  external: ['@verrou/core', '@lukeed/ms', 'croner', 'pino'],
})
