import { Command, Argument } from 'commander';
import { runVitest } from '../../evals/run-vitest';
import { lstatSync } from 'node:fs';
import { runEvalWithContext } from '../utils/eval-context-runner';
import type { FlagOverrides } from '../utils/parse-flag-overrides';
import { isGlob } from '../utils/glob-utils';

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
        if (!options.debug && (!options.token || !options.dataset)) {
          throw new Error('AXIOM_TOKEN, and AXIOM_DATASET must be set');
        }

        let targetPath = '.';
        let include = ['**/*.eval.ts'];
        let testNamePattern: RegExp | undefined;

        const isGlobPattern = isGlob(target);

        if (isGlobPattern) {
          // Handle glob patterns like "**/*.eval.ts" or "**/my-feature/*"
          include = [target];
        } else {
          try {
            // Try to treat as file/directory path
            const stat = lstatSync(target);
            if (stat.isDirectory()) {
              targetPath = target;
              include = ['**/*.eval.ts'];
            } else {
              // Single file
              include = [target];
            }
          } catch {
            // Path doesn't exist, treat as eval name
            testNamePattern = new RegExp(target, 'i');
          }
        }

        await runEvalWithContext(flagOverrides, async () => {
          return runVitest(targetPath, {
            watch: options.watch,
            baseline: options.baseline,
            include,
            testNamePattern,
            debug: options.debug,
          });
        });
      }),
  );
};
