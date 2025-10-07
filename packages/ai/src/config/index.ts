/**
 * Axiom API connection configuration
 */
export interface AxiomConnectionConfig {
  /**
   * Axiom API URL
   * @default 'https://api.axiom.co'
   * @example 'https://api.axiom.co'
   */
  url?: string;

  /**
   * Axiom API token
   * @example process.env.AXIOM_TOKEN
   */
  token?: string;

  /**
   * Axiom dataset name
   * @example process.env.AXIOM_DATASET
   */
  dataset?: string;
}

type AxiomEvalsInstrumentationConfig =
  | {
      type: 'file';
      path: string;
    }
  | {
      type: 'function';
      init: () => void;
    };

/**
 * Axiom AI SDK base configuration
 */
export interface AxiomConfigBase {
  /**
   * @internal
   * Debug flag to log when config is loaded
   */
  __debug__logConfig?: boolean;

  /**
   * Axiom API connection settings
   *
   * @example
   * ```typescript
   * axiom: {
   *   url: process.env.AXIOM_URL || 'https://api.axiom.co',
   *   token: process.env.AXIOM_TOKEN,
   *   dataset: process.env.AXIOM_DATASET
   * }
   * ```
   */
  eval?: // TODO: BEFORE MERGE - currently not handling
  AxiomConnectionConfig & {
    // TODO: BEFORE MERGE - currently not handling
    instrumentation?: AxiomEvalsInstrumentationConfig;
    // TODO: BEFORE MERGE - currently not handling
    timeoutMs?: number;
    // TODO: BEFORE MERGE - currently not handling
    include?: string[];
    // TODO: BEFORE MERGE - currently not handling
    exclude?: string[];
  };
}

/**
 * Axiom AI SDK configuration with optional environment-specific overrides.
 *
 * Supports c12 environment overrides using $development, $production, etc.
 *
 * @example
 * ```typescript
 * export default defineConfig({
 *   axiom: {
 *     url: 'https://api.axiom.co'
 *   },
 * })
 * ```
 */
export interface AxiomConfig extends AxiomConfigBase {
  /**
   * Allow c12 environment-specific overrides ($development, $production, $test etc.)
   * but don't show them in autocomplete for now
   */
  [key: `$${string}`]: Partial<AxiomConfigBase> | undefined;
}

/**
 * Type-safe helper for defining Axiom configuration.
 *
 * @param config - The configuration object
 * @returns The same configuration object with type checking
 *
 * @example
 * ```typescript
 * import { defineConfig } from 'axiom/ai/config'
 *
 * export default defineConfig({
 *   __debug__useConfig: true
 * })
 * ```
 */
export function defineConfig(config: AxiomConfig): AxiomConfig {
  return config;
}

export const defaultConfig: AxiomConfig = {
  __debug__logConfig: false,
  eval: {
    // TODO: BEFORE MERGE - does c12 offer a better way to handle this?
    include: [
      '**/*.eval.ts',
      '**/*.eval.js',
      '**/*.eval.mts',
      '**/*.eval.mjs',
      '**/*.eval.cts',
      '**/*.eval.cjs',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    timeoutMs: 60_000,
  },
};
