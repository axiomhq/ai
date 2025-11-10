import c from 'tinyrainbow';
import path from 'node:path';

import { createVitest, registerConsoleShortcuts } from 'vitest/node';
import type { TestRunResult } from 'vitest/node';
import { AxiomReporter } from './reporter';
import { flush, initInstrumentation } from './instrument';
import { setAxiomConfig } from './context/storage';
import type { ResolvedAxiomConfig } from '../config/index';

const printCollectedEvals = (result: TestRunResult, rootDir: string) => {
  if (!result.testModules || result.testModules.length === 0) {
    console.log(c.yellow('\nNo evaluations found\n'));
    return;
  }

  console.log(c.bold('\nFound evaluations:\n'));

  let totalEvals = 0;
  let totalCases = 0;

  for (const module of result.testModules) {
    const relativePath = path.relative(rootDir, module.moduleId);

    for (const suite of module.children.suites()) {
      totalEvals++;
      const caseCount = suite.children.size;
      totalCases += caseCount;
      console.log(c.green(`✓ ${suite.name} (${caseCount} cases)`));
      console.log(c.dim(`  ${relativePath}`));
      console.log('');
    }
  }

  console.log(c.bold(`Total: ${totalEvals} evaluations, ${totalCases} test cases\n`));
};

export const runVitest = async (
  dir: string,
  opts: {
    watch: boolean;
    baseline?: string;
    include: string[];
    exclude?: string[];
    testNamePattern?: RegExp;
    debug?: boolean;
    collectOnly?: boolean;
    overrides?: Record<string, any>;
    config: ResolvedAxiomConfig;
    runId: string;
  },
) => {
  // Store config globally so reporters can access it
  setAxiomConfig(opts.config);

  // Initialize instrumentation explicitly based on debug or collect-only flag
  await initInstrumentation({
    enabled: !opts.debug && !opts.collectOnly,
    config: opts.config,
  });

  const providedConfig: ResolvedAxiomConfig = {
    ...opts.config,
    eval: {
      ...opts.config.eval,
      // function can't be serialized, so we need to remove it
      instrumentation: null,
    },
  };

  if (opts.debug) {
    console.log(c.bgWhite(c.blackBright(' Debug mode enabled ')));
  }

  if (opts.collectOnly) {
    console.log(c.bgWhite(c.blackBright(' Collect-only mode ')));
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
      collectOnly: opts.collectOnly,
      overrides: opts.overrides,
      axiomConfig: providedConfig,
      runId: opts.runId,
    },
  });

  // Collect-only mode: just list tests without running them
  if (opts.collectOnly) {
    const result = await vi.collect();
    printCollectedEvals(result, dir || process.cwd());
    await vi.close();
    process.exit(0);
  }

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
