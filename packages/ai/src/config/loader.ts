import { loadConfig as c12LoadConfig } from 'c12';
import { defaultConfig, type AxiomConfig } from './index';

/**
 * Result of loading a config file
 */
export interface LoadConfigResult {
  config: AxiomConfig;
  configPath: string | null;
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
 * const { config, configPath } = await loadConfig();
 * if (configPath) {
 *   console.log('Loaded config from:', configPath);
 * }
 * ```
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<LoadConfigResult> {
  try {
    const result = await c12LoadConfig<AxiomConfig>({
      name: 'axiom',
      cwd,
      // Support common config file extensions
      configFile: 'axiom.config',
      // Default configuration with env var fallbacks
      // Applied before user config, so users can override anything
      defaultConfig: defaultConfig,
      // Disable configs other than .ts/.js/.mts/.mjs/.cts/.cjs
      rcFile: false,
      globalRc: false,
      packageJson: false,
      giget: false,
    });

    return {
      config: result.config || {},
      configPath: result.configFile || null,
    };
  } catch (error) {
    // c12 throws if config file has errors
    throw new Error(
      `Failed to load Axiom config: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
