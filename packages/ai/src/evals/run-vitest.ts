import c from 'tinyrainbow';

import { createVitest, registerConsoleShortcuts } from 'vitest/node';
import { AxiomReporter } from './reporter';
import { flush, initInstrumentation } from './instrument';
import { setAxiomConfig } from './context/storage';
import type { ResolvedAxiomConfig } from '../config/index';

export const runVitest = async (
  dir: string,
  opts: {
    watch: boolean;
    baseline?: string;
    include: string[];
    exclude?: string[];
    testNamePattern?: RegExp;
    debug?: boolean;
    overrides?: Record<string, any>;
    config: ResolvedAxiomConfig;
    configPath?: string | null;
  },
) => {
  // Store config globally so reporters can access it
  setAxiomConfig(opts.config);

  // Initialize instrumentation explicitly based on debug flag
  await initInstrumentation({
    enabled: !opts.debug,
    config: opts.config,
    configPath: opts.configPath ?? null,
  });

  const providedConfig: ResolvedAxiomConfig = {
    ...opts.config,
    eval: {
      ...opts.config.eval,
      instrumentation: null,
    },
  };

  if (opts.debug) {
    console.log(c.bgWhite(c.blackBright(' Debug mode enabled ')));
  }

  const vi = await createVitest('test', {
    root: dir ? dir : process.cwd(),
    mode: 'test',
    include: opts.include,
    exclude: opts.exclude,
    testNamePattern: opts.testNamePattern,
    reporters: ['verbose', new AxiomReporter()],
    environment: 'node',
    browser: undefined,
    watch: opts.watch,
    name: 'axiom:eval',
    printConsoleTrace: true,
    silent: false,
    disableConsoleIntercept: true,
    testTimeout: opts.config?.eval?.timeoutMs || 60_000,
    globals: true,
    provide: {
      baseline: opts.baseline,
      debug: opts.debug,
      overrides: opts.overrides,
      axiomConfig: providedConfig,
      axiomConfigPath: opts.configPath ?? null,
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
