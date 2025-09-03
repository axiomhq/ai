import { createVitest, registerConsoleShortcuts } from 'vitest/node';
import { AxiomReporter } from './reporter';
import { flush } from './instrument';

export const DEFAULT_TIMEOUT = 10000;

export const runVitest = async (
  dir: string,
  opts: {
    watch: boolean;
    baseline?: string;
    include: string[];
  },
) => {
  const vi = await createVitest('test', {
    root: dir ? dir : process.cwd(),
    mode: 'test',
    include: opts.include,
    reporters: [new AxiomReporter()],
    environment: 'node',
    browser: undefined,
    watch: opts.watch,
    name: 'axiom:eval',
    printConsoleTrace: true,
    silent: false,
    disableConsoleIntercept: true,
    testTimeout: DEFAULT_TIMEOUT,
    globals: true,
    provide: {
      baseline: opts.baseline,
    },
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
