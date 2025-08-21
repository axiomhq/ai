import { createVitest, registerConsoleShortcuts } from 'vitest/node';
import { AxiomReporter } from './reporter';
import { flush, instrument } from './instrument';
import type { AxiomConfig } from 'src/config';

export const runVitest = async (config: AxiomConfig, file: string) => {
  instrument(config)
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
