import globals from 'globals';
import tsdoc from 'eslint-plugin-tsdoc';
import tsParser from '@typescript-eslint/parser';
import tsEslint from 'typescript-eslint';
// @ts-expect-error TODO: idk
import eslintConfigPrettier from 'eslint-config-prettier';

/**
 * A custom ESLint configuration for libraries.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  eslintConfigPrettier,
  {
    ignores: ['**/dist/', '**/node_modules/', '**/coverage/'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: {
      tsdoc,
      '@typescript-eslint': tsEslint.plugin,
    },
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      'no-unused-vars': 'off',
    },
  },
];
