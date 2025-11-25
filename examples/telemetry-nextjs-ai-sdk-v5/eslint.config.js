import { config } from '@repo/eslint-config';

export default [
  {
    ignores: ['.next/**'],
  },
  ...config,
];
