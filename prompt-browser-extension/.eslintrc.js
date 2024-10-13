module.exports = {
  root: true,
  env: {
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  overrides: [
    {
      files: ['*.ts'],
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
  ],
  rules: {
    // Acceptable values are 'off', 'warn' and 'error'.
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-var-requires': 'off',

    // Temporarily disabled, due to currently unresolved "false positive" warnings in some test-cases.
    // '@typescript-eslint/no-floating-promises': 'warn',

    'no-async-promise-executor': 'off',
    'no-useless-escape': 'off',
  },
};
