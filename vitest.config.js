import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node', // pure logic tests — reducer, selectors, engine — no DOM needed
    include: ['src/**/*.test.js'],
    globals: false,
  },
});
