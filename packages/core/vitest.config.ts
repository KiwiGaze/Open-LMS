import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    sequence: { concurrent: false },
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
