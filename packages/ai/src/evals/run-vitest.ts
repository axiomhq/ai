import { createVitest, registerConsoleShortcuts } from 'vitest/node';
import { flush } from './instrument';
import { AxiomExperimentReporter } from './experiment.reporter';

export const DEFAULT_TIMEOUT = 10000;

export const runVitest = async (
  dir: string,
  opts: {
    include: string[];
    watch: boolean;
  },
) => {
  const vi = await createVitest('test', {
    root: dir ? dir : process.cwd(),
    mode: 'test',
    include: opts.include,
    reporters: [new AxiomExperimentReporter()],
    environment: 'node',
    browser: undefined,
    watch: opts.watch,
    name: 'axiom:eval',
    printConsoleTrace: true,
    silent: false,
    disableConsoleIntercept: true,
    testTimeout: DEFAULT_TIMEOUT,
    globals: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    provide: {
      axiom_token: process.env.AXIOM_TOKEN,
      axiom_url: process.env.AXIOM_URL,
      axiom_dataset: process.env.AXIOM_DATASET,
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
