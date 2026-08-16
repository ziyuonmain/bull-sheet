import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.serviceworker,
        ...globals.es2021
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'log'] }],
      'no-empty': ['warn', { allowEmptyCatch: true }]
    }
  },
  {
    ignores: [
      'node_modules/**',
      'test-results/**',
      'playwright-report/**',
      'scratch/**'
    ]
  }
];
