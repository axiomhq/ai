import c from 'tinyrainbow';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { mkdirSync, writeFileSync, unlinkSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

import { createVitest, registerConsoleShortcuts } from 'vitest/node';
import { AxiomReporter } from './reporter';
import { flush, initInstrumentation } from './instrument';
import { setAxiomConfig } from './context/storage';
import type { ResolvedAxiomConfig } from '../config/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    runId: string;
  },
) => {
  // Store config globally so reporters can access it
  setAxiomConfig(opts.config);

  // Initialize instrumentation explicitly based on debug flag
  await initInstrumentation({
    enabled: !opts.debug,
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
    runner: resolve(__dirname, 'evals', 'custom-runner.js'),
    provide: {
      baseline: opts.baseline,
      debug: opts.debug,
      overrides: opts.overrides,
      axiomConfig: providedConfig,
      runId: opts.runId,
    },
  });

  // Start collection and execution
  // Note: We validate in the custom runner before any suite executes
  // The abort file will be written by workers if they detect invalid names
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
