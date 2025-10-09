import { loadConfig as c12LoadConfig } from 'c12';
import {
  createPartialDefaults,
  validateConfig,
  type AxiomConfig,
  type ResolvedAxiomConfig,
} from './index';
import { AxiomCLIError, errorToString } from '../cli/errors';

/**
 * Result of loading a config file
 */
export interface LoadConfigResult {
  config: ResolvedAxiomConfig;
}

/**
 * Load Axiom configuration from axiom.config.ts (or .js, .mjs, etc.)
 *
 * Uses c12 for smart configuration loading with support for:
 * - Multiple file formats (.ts, .mts, .cts, .js, .mjs, .cjs, .json, .yaml, .toml)
 * - Environment-specific overrides ($development, $production, etc.)
 * - Config extending (extends field)
 * - RC files (.axiomrc)
 * - Package.json integration
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
    const result = await c12LoadConfig<AxiomConfig>({
      name: 'axiom',
      cwd,
      // Support common config file extensions
      configFile: 'axiom.config',
      // Partial defaults with env var fallbacks
      // Applied before user config, so users can override anything
      defaultConfig: createPartialDefaults() as AxiomConfig,
      // Disable configs other than .ts/.js/.mts/.mjs/.cts/.cjs
      rcFile: false,
      globalRc: false,
      packageJson: false,
      giget: false,
    });

    // Validate merged config has all required values
    const validatedConfig = validateConfig(result.config);

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
