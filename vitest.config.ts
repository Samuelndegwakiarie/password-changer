import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@recoverly/shared-types': resolve(__dirname, 'packages/shared-types/src/index.ts'),
      '@recoverly/password-core': resolve(__dirname, 'packages/password-core/src/index.ts'),
      '@recoverly/adapter-contracts': resolve(__dirname, 'packages/adapter-contracts/src/index.ts'),
      '@recoverly/test-fixtures': resolve(__dirname, 'packages/test-fixtures/src/index.ts'),
    },
  },
  test: {
    include: ['**/*.test.ts'],
    exclude: ['**/dist/**', '**/node_modules/**'],
  },
});
