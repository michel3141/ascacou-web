import { defineConfig } from 'oxlint';

export default defineConfig({
  categories: {
    correctness: 'error',
    suspicious: 'warn',
    nursery: 'error',
  },
  env: {
    browser: true,
    node: true,
  },
  rules: {
    'no-unused-vars': [
      'error',
      {
        args: 'none',
        varsIgnorePattern: '^(_|logger)$',
      },
    ],
  },
});
