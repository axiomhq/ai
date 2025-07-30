import { createVitest, registerConsoleShortcuts } from 'vitest/node';
import { AxiomReporter } from './reporter';
import { flush } from './instrument';

export const runVitest = async (file: string) => {
  const vi = await createVitest('test', {
    // root: process.cwd(),
    mode: 'test',
    include: [file ? file : '**/*.eval.ts'],
    reporters: ['verbose', new AxiomReporter()],
    environment: 'node',
    browser: undefined,
  });

  await vi.start();

  const dispose = registerConsoleShortcuts(vi, process.stdin, process.stdout);

  if (!vi.shouldKeepServer()) {
    dispose();
    await flush();
    await vi.close();
    process.exit(0);
  }

  await flush();
};
