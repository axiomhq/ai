import { config } from '@repo/eslint-config';

export default [
  ...config,
  {
    files: ['src/cli/**/*.ts', 'src/bin.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'vitest',
              message:
                'vitest must not be imported in CLI code. Use dynamic import inside command handlers: const { runVitest } = await import("../../evals/run-vitest")',
            },
            {
              name: 'vitest/node',
              message:
                'vitest/node must not be imported in CLI code. Use dynamic import inside command handlers.',
            },
            {
              name: 'vitest/runners',
              message:
                'vitest/runners must not be imported in CLI code. Use dynamic import inside command handlers.',
            },
            {
              name: 'vite-tsconfig-paths',
              message:
                'vite-tsconfig-paths must not be imported in CLI code. Use dynamic import inside command handlers.',
            },
          ],
          patterns: [
            {
              group: ['**/evals/run-vitest', '**/evals/run-vitest.js'],
              message:
                'run-vitest must be dynamically imported inside command handlers to avoid loading vitest at CLI startup.',
            },
          ],
        },
      ],
    },
  },
];
