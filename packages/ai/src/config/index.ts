/**
 * Utility type to make all properties in T required recursively.
 * Keeps the types as-is but removes the optionality.
 */
type DeepRequired<T> =
  T extends Array<infer U>
    ? Array<U>
    : T extends object
      ? {
          [P in keyof T]-?: DeepRequired<T[P]>;
        }
      : T;

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
   * Axiom API token (can be undefined if not set)
   * @example process.env.AXIOM_TOKEN
   */
  token?: string | undefined;

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
 * Axiom AI SDK base configuration (user-facing, all optional)
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
 * Resolved Axiom AI SDK configuration with all required keys.
 * This is the type returned after merging user config with defaults.
 *
 * Uses DeepRequired to ensure all optional properties from AxiomConfigBase
 * become required, preventing missing properties in the resolved config.
 */
export type ResolvedAxiomConfig = DeepRequired<AxiomConfigBase>;

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

/**
 * Create default configuration from environment variables.
 *
 * @returns Resolved configuration with all required properties
 */
export function createDefaultConfig(): ResolvedAxiomConfig {
  const token = process.env.AXIOM_TOKEN;
  const dataset = process.env.AXIOM_DATASET;

  if (!token) {
    throw new Error(
      '[AxiomAI] Missing Axiom eval token. Please either set in `axiom.config.ts` or `process.env.AXIOM_TOKEN`.',
    );
  }
  if (!dataset) {
    throw new Error(
      '[AxiomAI] Missing Axiom eval dataset. Please either set in `axiom.config.ts` or `process.env.AXIOM_DATASET`.',
    );
  }

  return {
    __debug__logConfig: false,
    eval: {
      url: process.env.AXIOM_URL || 'https://api.axiom.co',
      token: token,
      dataset: dataset,
      instrumentation: { type: 'file', path: 'TODO: BEFORE MERGE - figure this out' },
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
  } satisfies ResolvedAxiomConfig;
}
