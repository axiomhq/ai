import { Command, Argument, Option } from 'commander';
import { customAlphabet } from 'nanoid';
import { runVitest } from '../../evals/run-vitest';
import { lstatSync } from 'node:fs';
import { runEvalWithContext } from '../utils/eval-context-runner';
import type { FlagOverrides } from '../utils/parse-flag-overrides';
import { isGlob } from '../utils/glob-utils';
import { loadConfig } from '../../config/loader';
import { AxiomCLIError } from '../errors';
import { getAuthContext } from '../auth/global-auth';
import c from 'tinyrainbow';

const createRunId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

// Module-level storage for console URL override
let consoleUrl: string | undefined;
export function getConsoleUrl(): string | undefined {
  return consoleUrl;
}
/**
 * Gets default token from auth context or falls back to env var
 */
function getDefaultToken(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  const authContext = getAuthContext();
  return authContext?.token || process.env.AXIOM_TOKEN;
}

/**
 * Gets default URL from auth context or falls back to env var
 */
function getDefaultUrl(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  const authContext = getAuthContext();
  return authContext?.url || process.env.AXIOM_URL || 'https://api.axiom.co';
}

/**
 * Gets default organization id from auth context or falls back to env var
 */
function getDefaultOrgId(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  const authContext = getAuthContext();
  return authContext?.orgId ?? process.env.AXIOM_ORG_ID;
}

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
      .option('-t, --token <TOKEN>', 'axiom token', getDefaultToken)
      .option('-d, --dataset <DATASET>', 'axiom dataset name', process.env.AXIOM_DATASET)
      .option('-u, --url <AXIOM URL>', 'axiom url', getDefaultUrl)
      .option('-o, --org-id <ORG ID>', 'axiom organization id', getDefaultOrgId)
      .option('-b, --baseline <BASELINE ID>', 'id of baseline evaluation to compare against')
      .option('--debug', 'run locally without sending to Axiom or loading baselines', false)
      .option('--list', 'list evaluations and test cases without running them', false)
      /** Hides the option from the help output, but still allows it to be passed */
      .addOption(new Option('-c, --console-url <URL>', 'console url override').hideHelp())
      .action(async (target: string, options) => {
        try {
          // Propagate debug mode to processes that we can't reach otherwise (e.g., reporter, app instrumentation)
          if (options.debug) {
            process.env.AXIOM_DEBUG = 'true';
          }

          let include: string[] = [];
          let exclude: string[] | undefined;
          let testNamePattern: RegExp | undefined;

          const isGlobPattern = isGlob(target);

          // Load config file first to get defaults
          const { config: loadedConfig } = await loadConfig('.');

          // Override config with CLI options if provided
          const config = {
            ...loadedConfig,
            eval: {
              ...loadedConfig.eval,
              ...(options.token && { token: options.token }),
              ...(options.url && { url: options.url }),
              ...(options.dataset && { dataset: options.dataset }),
              ...(options.orgId && { orgId: options.orgId }),
            },
          };

          if (isGlobPattern) {
            // Handle glob patterns like "**/*.eval.ts" or "**/my-feature/*"
            include = [target];
          } else {
            try {
              // Try to treat as file/directory path
              const stat = lstatSync(target);
              if (stat.isDirectory()) {
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

          exclude = config?.eval?.exclude;

          if (!config?.eval?.instrumentation) {
            console.warn(
              c.yellow(
                '⚠ App instrumentation (`eval.instrumentation` in `axiom.config.ts`) not configured. Using default provider.',
              ),
            );
            console.log('');
          }

          const runId = createRunId();

          consoleUrl = options.consoleUrl;

          await runEvalWithContext(flagOverrides, async () => {
            return runVitest('.', {
              watch: options.watch,
              baseline: options.baseline,
              include,
              exclude,
              testNamePattern,
              debug: options.debug,
              list: options.list,
              overrides: flagOverrides,
              config,
              runId,
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
