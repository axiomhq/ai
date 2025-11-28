import c from 'tinyrainbow';
import { resolve, join } from 'node:path';
import { mkdirSync, writeFileSync, unlinkSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';

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
    list?: boolean;
    overrides?: Record<string, any>;
    config: ResolvedAxiomConfig;
    runId: string;
    consoleUrl?: string;
  },
) => {
  // Store config globally so reporters can access it
  setAxiomConfig(opts.config);
  // Initialize instrumentation explicitly based on debug or list flag
  await initInstrumentation({
    enabled: !opts.debug && !opts.list,
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

  // Setup temp files for cross-worker name validation
  const tmpDir = join(tmpdir(), 'axiom-eval', opts.runId);
  mkdirSync(tmpDir, { recursive: true });

  const nameRegistryFile = join(tmpDir, 'names.jsonl');
  const abortFile = join(tmpDir, 'abort.txt');

  // Clear registry file and remove any stale abort file
  writeFileSync(nameRegistryFile, '', 'utf8');
  if (existsSync(abortFile)) {
    unlinkSync(abortFile);
  }

  // Make paths available to workers and reporters
  process.env.AXIOM_NAME_REGISTRY_FILE = nameRegistryFile;
  process.env.AXIOM_ABORT_FILE = abortFile;

  if (opts.list) {
    console.log(c.bgWhite(c.blackBright(' List mode ')));
  }

  const vi = await createVitest(
    'test',
    {
      root: dir ? dir : process.cwd(),
      mode: 'test',
      include: opts.include,
      exclude: opts.exclude,
      testNamePattern: opts.testNamePattern,
      reporters: ['verbose', new AxiomReporter()],
      environment: 'node',
      browser: undefined,
      watch: opts.watch,
      setupFiles: [], // ignore user vitest.config.ts etc
      name: 'axiom:eval',
      printConsoleTrace: true,
      silent: false,
      disableConsoleIntercept: true,
      testTimeout: opts.config?.eval?.timeoutMs || 60_000,
      globals: true,
      runner: resolve(__dirname, 'evals', 'custom-runner.js'),
      provide: {
        baseline: opts.baseline,
        debug: opts.debug,
        list: opts.list,
        overrides: opts.overrides,
        axiomConfig: providedConfig,
        runId: opts.runId,
        consoleUrl: opts.consoleUrl,
      },
    },
    {
      plugins: [tsconfigPaths({ root: dir || process.cwd() })],
    },
  );

  // List mode: just list tests without running them
  if (opts.list) {
    const result = await vi.collect();
    printCollectedEvals(result, dir || process.cwd());
    await vi.close();
    process.exit(0);
  }

  // Start collection and execution
  await vi.start();

  // After execution, check if validation failed
  if (existsSync(abortFile)) {
    const message = readFileSync(abortFile, 'utf8');
    console.error('\n' + message);
    await vi.close();
    process.exit(1);
  }

  const dispose = registerConsoleShortcuts(vi, process.stdin, process.stdout);

  if (!vi.shouldKeepServer()) {
    dispose();
    await flush();
    await vi.close();
    process.exit(0);
  }

  await flush();
};
