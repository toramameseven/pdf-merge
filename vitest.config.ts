import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/vtest/**/*.{js,ts}'], 
    exclude: ['src/test/**/*.{js,ts}']
  },
});