import { createJiti } from 'jiti';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { AxiomConfig } from './index';

/**
 * Result of loading a config file
 */
export interface LoadConfigResult {
  config: AxiomConfig;
  configPath: string | null;
}

/**
 * Supported config file names (in order of precedence)
 */
const CONFIG_FILE_NAMES = [
  'axiom.config.ts',
  'axiom.config.mts',
  'axiom.config.cts',
  'axiom.config.js',
  'axiom.config.mjs',
  'axiom.config.cjs',
] as const;

/**
 * Find the config file in the given directory
 */
function findConfigFile(cwd: string): string | null {
  for (const fileName of CONFIG_FILE_NAMES) {
    const filePath = join(cwd, fileName);
    if (existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

/**
 * Load Axiom configuration from axiom.config.ts (or .js, .mjs, etc.)
 *
 * Uses jiti to handle TypeScript and ESM files seamlessly.
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
  const configPath = findConfigFile(cwd);

  // No config file found - return empty config
  if (!configPath) {
    return {
      config: {},
      configPath: null,
    };
  }

  try {
    // Resolve to absolute path before passing to jiti
    const absoluteConfigPath = resolve(configPath);

    // Create jiti instance with caching enabled
    const jiti = createJiti(import.meta.url, {
      cache: true,
      fsCache: true,
      interopDefault: true,
    });

    // Load the config file using absolute path
    const loaded = await jiti.import(absoluteConfigPath);

    // Handle both default export and named exports
    const config: AxiomConfig = loaded.default || loaded;

    return {
      config,
      configPath: absoluteConfigPath,
    };
  } catch (error) {
    // If config file exists but fails to load, throw an error
    throw new Error(
      `Failed to load config from ${configPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
