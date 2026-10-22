import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'github-oidc',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    passWithNoTests: true,
  },
});
