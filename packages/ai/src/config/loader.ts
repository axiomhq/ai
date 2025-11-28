import { loadConfig as c12LoadConfig } from 'c12';
import { defu } from 'defu';
import {
  createPartialDefaults,
  validateConfig,
  type AxiomConfig,
  type ResolvedAxiomConfig,
} from './index';
import { AxiomCLIError, errorToString } from '../util/errors';

/**
 * Custom merger that uses defu but overrides include/exclude arrays instead of merging them
 */
function customMerger(target: any, source: any): any {
  const merged = defu(source, target);

  // If source explicitly has eval.include, override it instead of merging
  if (source?.eval && 'include' in source.eval) {
    merged.eval.include = source.eval.include;
  }

  // If source explicitly has eval.flagSchema, use it directly (defu mangles Zod objects)
  if (source?.eval && 'flagSchema' in source.eval) {
    merged.eval.flagSchema = source.eval.flagSchema;
  }

  return merged;
}

/**
 * Result of loading a config file
 */
export interface LoadConfigResult {
  config: ResolvedAxiomConfig;
}

/**
 * Load Axiom configuration from axiom.config.ts (or .js, .mjs, etc.)
 *
 * @param cwd - The directory to search for config file (defaults to process.cwd())
 * @returns The loaded config and the path to the config file (if found)
 *
 * @example
 * ```typescript
 * const { config } = await loadConfig();
 * ```
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<LoadConfigResult> {
  try {
    const defaults = createPartialDefaults();

    const result = await c12LoadConfig<AxiomConfig>({
      name: 'axiom',
      cwd,
      // Support common config file extensions
      configFile: 'axiom.config',
      // Don't use defaultConfig - we'll merge manually to control array behavior
      // Disable configs other than .ts/.js/.mts/.mjs/.cts/.cjs
      rcFile: false,
      globalRc: false,
      packageJson: false,
      giget: false,
    });

    // Manually merge with defaults, overriding `include` instead of merging
    const mergedConfig = customMerger(defaults, result.config);
    const validatedConfig = validateConfig(mergedConfig);

    return {
      config: validatedConfig,
    };
  } catch (error) {
    if (error instanceof AxiomCLIError) {
      throw error;
    }
    // c12 throws if config file has errors
    throw new AxiomCLIError(`Failed to load config file: ${errorToString(error)}`);
  }
}
