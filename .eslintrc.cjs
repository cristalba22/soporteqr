module.exports = {
  root: true,
  ignorePatterns: ['**/dist/**', '**/node_modules/**', '**/coverage/**', 'apps/api/uploads/**'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      files: ['apps/api/**/*.ts', 'packages/shared/**/*.ts'],
      env: { node: true, es2022: true },
    },
    {
      files: ['apps/web/**/*.{ts,tsx}'],
      env: { browser: true, es2022: true },
      parserOptions: { ecmaFeatures: { jsx: true } },
      plugins: ['react-hooks', 'react-refresh'],
      rules: {
        ...require('eslint-plugin-react-hooks').configs.recommended.rules,
        'react-refresh/only-export-components': [
          'error',
          { allowConstantExport: true, allowExportNames: ['useAuth'] },
        ],
      },
    },
  ],
};
