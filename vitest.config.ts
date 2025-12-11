import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/*/src/**/*.ts'],
      exclude: ['packages/*/src/**/*.spec.ts']
    }
  },
  resolve: {
    alias: {
      '@lavoro/core': '/home/aleksei/projects/lavoro/packages/core/src/index.ts',
      '@lavoro/memory': '/home/aleksei/projects/lavoro/packages/memory/src/index.ts',
      '@lavoro/postgres': '/home/aleksei/projects/lavoro/packages/postgres/src/index.ts',
    }
  }
})
