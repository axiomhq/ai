import type { TracerProvider } from '@opentelemetry/api';
import { AxiomCLIError } from '../cli/errors';

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

/**
 * Options passed to the instrumentation hook
 * - url: string
 * - token: string
 * - dataset: string
 */
export interface AxiomEvalInstrumentationOptions {
  url: string;
  token: string;
  dataset: string;
}

/**
 * Result returned from the instrumentation hook
 * - provider: TracerProvider
 */
export interface AxiomEvalInstrumentationResult {
  provider: TracerProvider;
}

/**
 * Hook function to initialize application OpenTelemetry instrumentation.
 * Called before eval execution with resolved Axiom connection details.
 *
 * @param options - Configuration options
 * @param options.url - Axiom API URL
 * @param options.token - Axiom API token
 * @param options.dataset - Axiom dataset name
 * @returns TracerProvider or Promise resolving to TracerProvider
 *
 * @example
 * ```typescript
 * instrumentation: ({ url, token, dataset }) => {
 *   return setupAppInstrumentation({ url, token, dataset });
 * }
 * ```
 */
export type AxiomEvalInstrumentationHook = (
  options: AxiomEvalInstrumentationOptions,
) => AxiomEvalInstrumentationResult | Promise<AxiomEvalInstrumentationResult>;

/**
 * Axiom AI SDK base configuration (user-facing, all optional)
 */
export interface AxiomConfigBase {
  /**
   * Eval configuration settings
   *
   * @example
   * ```typescript
   * eval: {
   *   url: process.env.AXIOM_URL,
   *   token: process.env.AXIOM_TOKEN,
   *   dataset: process.env.AXIOM_DATASET
   * }
   * ```
   */
  eval?: AxiomConnectionConfig & {
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
 *   eval: {
 *     url: process.env.AXIOM_URL,
 *     token: process.env.AXIOM_TOKEN,
 *     dataset: process.env.AXIOM_DATASET,
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
 * import { defineConfig } from 'axiom/ai/config';
 *
 * export default defineConfig({
 *   eval: {
 *     url: process.env.AXIOM_URL,
 *     token: process.env.AXIOM_TOKEN,
 *     dataset: process.env.AXIOM_DATASET,
 *     include: ['**\/*.eval.{ts,js}'],
 *     instrumentation: ({ url, token, dataset }) => setupAppInstrumentation({ url, token, dataset }),
 *   },
 * });
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

/**
 * Validates and returns a fully resolved Axiom configuration.
 *
 * @param config - Partial configuration to validate
 * @returns Fully resolved configuration with all required fields
 * @throws {AxiomCLIError} If required fields are missing or invalid
 * @internal
 */
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

  if (!config.eval?.url) {
    console.log(
      'eval.url was not specified. Defaulting to `https://api.axiom.co`. Please set it in axiom.config.ts or AXIOM_URL environment variable if you want to use a different endpoint.',
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
