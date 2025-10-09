import { Command, Argument } from 'commander';
import { runVitest } from '../../evals/run-vitest';
import { lstatSync } from 'node:fs';
import { runEvalWithContext } from '../utils/eval-context-runner';
import type { FlagOverrides } from '../utils/parse-flag-overrides';
import { isGlob } from '../utils/glob-utils';
import { loadConfig } from '../../config/loader';
import { AxiomCLIError } from '../errors';
import c from 'tinyrainbow';

export const loadEvalCommand = (program: Command, flagOverrides: FlagOverrides = {}) => {
  return program.addCommand(
    new Command('eval')
      .description('run evals locally')
      .addArgument(
        new Argument('[target]', 'file, directory, glob pattern, or eval name').default(
          '.',
          'any *.eval.ts file in current directory',
        ),
      )
      .option('-w, --watch true', 'keep server running and watch for changes', false)
      .option('-t, --token <TOKEN>', 'axiom token', process.env.AXIOM_TOKEN)
      .option('-d, --dataset <DATASET>', 'axiom dataset name', process.env.AXIOM_DATASET)
      .option('-u, --url <AXIOM URL>', 'axiom url', process.env.AXIOM_URL ?? 'https://api.axiom.co')
      .option('-b, --baseline <BASELINE ID>', 'id of baseline evaluation to compare against')
      .option('--debug', 'run locally without sending to Axiom or loading baselines', false)
      .action(async (target: string, options) => {
        try {
          // Propagate debug mode to processes that we can't reach otherwise (e.g., reporter, app instrumentation)
          if (options.debug) {
            process.env.AXIOM_DEBUG = 'true';
          }

          let targetPath = '.';
          let include: string[] = [];
          let exclude: string[] | undefined;
          let testNamePattern: RegExp | undefined;

          const isGlobPattern = isGlob(target);

          // Load config file first to get defaults
          const { config } = await loadConfig(target === '.' ? '.' : targetPath);

          if (isGlobPattern) {
            // Handle glob patterns like "**/*.eval.ts" or "**/my-feature/*"
            include = [target];
          } else {
            try {
              // Try to treat as file/directory path
              const stat = lstatSync(target);
              if (stat.isDirectory()) {
                targetPath = target;
                // Use config include patterns
                include = config?.eval?.include || [];
              } else {
                // Single file
                include = [target];
              }
            } catch {
              // Path doesn't exist, treat as eval name
              testNamePattern = new RegExp(target, 'i');
              // Use config include patterns when searching by name
              include = config?.eval?.include || [];
            }
          }

          // Always use config exclude patterns
          exclude = config?.eval?.exclude;

          // Warn once at CLI level if instrumentation is missing
          if (!config?.eval?.instrumentation) {
            console.warn(
              c.yellow(
                '⚠ App instrumentation (`eval.instrumentation` in `axiom.config.ts`) not configured. Using default provider.',
              ),
            );
            console.log('');
          }

          await runEvalWithContext(flagOverrides, async () => {
            return runVitest(targetPath, {
              watch: options.watch,
              baseline: options.baseline,
              include,
              exclude,
              testNamePattern,
              debug: options.debug,
              overrides: flagOverrides,
              config,
            });
          });
        } catch (error) {
          if (error instanceof AxiomCLIError) {
            console.error(`\n❌ ${error.message}\n`);
            process.exit(1);
          }
          throw error;
        }
      }),
  );
};
