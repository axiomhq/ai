import c from 'tinyrainbow';

import { createVitest, registerConsoleShortcuts } from 'vitest/node';
import { AxiomReporter } from './reporter';
import { flush, initInstrumentation } from './instrument';

export const DEFAULT_TIMEOUT = parseInt(process.env.AXIOM_TIMEOUT || '60000');

export const runVitest = async (
  dir: string,
  opts: {
    watch: boolean;
    baseline?: string;
    include: string[];
    testNamePattern?: RegExp;
    debug?: boolean;
    overrides?: Record<string, any>;
  },
) => {
  // Initialize instrumentation explicitly based on debug flag
  initInstrumentation({ enabled: !opts.debug });

  if (opts.debug) {
    console.log(c.bgWhite(c.blackBright(' Debug mode enabled ')));
  }

  const vi = await createVitest('test', {
    root: dir ? dir : process.cwd(),
    mode: 'test',
    include: opts.include,
    testNamePattern: opts.testNamePattern,
    reporters: ['verbose', new AxiomReporter()],
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
      debug: opts.debug,
      overrides: opts.overrides,
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
