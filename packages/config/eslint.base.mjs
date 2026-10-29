import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export function createEslintConfig(options = {}) {
  const { isReact = false } = options;

  return tseslint.config(
    {
      ignores: [
        '**/dist/**',
        '**/node_modules/**',
        '**/coverage/**',
        '**/.turbo/**',
        '**/@mf-types/**',
      ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    eslintConfigPrettier,
    {
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        globals: {
          ...globals.node,
          ...(isReact ? globals.browser : {}),
        },
      },
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    },
  );
}

export default createEslintConfig();

