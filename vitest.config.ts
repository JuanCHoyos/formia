import { defineConfig } from 'vitest/config';

// The frontend is not listed here: its tests run through the Angular builder (`ng test`).
export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: ['apps/backend', 'apps/github-oidc', 'packages/core'],
  },
});
