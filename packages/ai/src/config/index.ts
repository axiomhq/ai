import type { Tracer, TracerProvider } from '@opentelemetry/api';
import { AxiomCLIError as AxiomCLIError } from '../cli/errors';

/**
 * Utility type to make all properties in T required recursively.
 * Keeps the types as-is but removes the optionality.
 */
type DeepRequired<T> =
  T extends Array<infer U>
    ? Array<U>
    : T extends (...args: any[]) => any
      ? T
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

export interface AxiomEvalInstrumentationOptions {
  url: string;
  token?: string;
  dataset: string;
}

export interface AxiomEvalInstrumentationResult {
  tracer?: Tracer;
  provider?: TracerProvider;
}

export type AxiomEvalInstrumentationHook = (
  options: AxiomEvalInstrumentationOptions,
) => void | AxiomEvalInstrumentationResult | Promise<void | AxiomEvalInstrumentationResult>;

/**
 * Axiom AI SDK base configuration (user-facing, all optional)
 */
export interface AxiomConfigBase {
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
    /**
     * Optional hook to initialize application OpenTelemetry instrumentation.
     * Called before eval execution with resolved Axiom connection details.
     * Return your configured tracer provider/tracer (or void) after registering them.
     */
    instrumentation?: AxiomEvalInstrumentationHook | null;
    /**
     * Timeout for eval execution in milliseconds
     * @default 60000
     */
    timeoutMs?: number;
    /**
     * Glob patterns to include when running evals
     * @default ['**\/*.eval.{ts,js,mts,mjs,cts,cjs}']
     * @example ['**\/*.eval.ts', 'tests/**\/*.test.ts']
     */
    include?: string[];
    /**
     * Glob patterns to exclude when running evals
     * @default ['**\/node_modules/**', '**\/dist/**', '**\/build/**']
     * @example ['**\/node_modules/**', '**\/.next/**']
     */
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

// TODO: BEFORE MERGE - give a better example
/**
 * Type-safe helper for defining Axiom configuration.
 *
 * @param config - The configuration object
 * @returns The same configuration object with type checking
 *
 * @example
 * ```typescript
 * import { defineConfig } from 'axiom/ai/config'
 * ```
 */
export function defineConfig(config: AxiomConfig): AxiomConfig {
  return config;
}

/**
 * Create partial default configuration from environment variables.
 * Does not throw if required values are missing - validation happens after merge.
 *
 * @returns Partial configuration with defaults and env var values
 * @internal
 */
export function createPartialDefaults(): Partial<AxiomConfigBase> {
  return {
    eval: {
      url: process.env.AXIOM_URL || 'https://api.axiom.co',
      token: process.env.AXIOM_TOKEN,
      dataset: process.env.AXIOM_DATASET,
      instrumentation: null,
      include: [],
      exclude: [],
      timeoutMs: 60_000,
    },
  };
}

export function validateConfig(config: Partial<AxiomConfigBase>): ResolvedAxiomConfig {
  const errors: string[] = [];

  if (!config.eval?.token) {
    errors.push(
      'eval.token is required (set in axiom.config.ts or AXIOM_TOKEN environment variable)',
    );
  }
  if (!config.eval?.dataset) {
    errors.push(
      'eval.dataset is required (set in axiom.config.ts or AXIOM_DATASET environment variable)',
    );
  }

  const instrumentation = config.eval?.instrumentation;
  if (
    instrumentation !== null &&
    instrumentation !== undefined &&
    typeof instrumentation !== 'function'
  ) {
    errors.push(
      'eval.instrumentation must be a function returning OTEL setup information or null.',
    );
  }

  if (errors.length > 0) {
    throw new AxiomCLIError(`Invalid Axiom configuration:\n  - ${errors.join('\n  - ')}`);
  }

  return config as ResolvedAxiomConfig;
}
