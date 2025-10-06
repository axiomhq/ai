/**
 * Axiom AI SDK Configuration
 *
 * This module provides configuration types and helpers for the Axiom AI SDK.
 */

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

/**
 * Axiom AI SDK configuration
 */
export interface AxiomConfig {
  /**
   * @internal
   * Debug flag to log when config is loaded
   */
  __debug__useConfig?: boolean;

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
  axiom?: AxiomConnectionConfig;

  // Future config options:
  // evals?: { timeout?: number; include?: string[]; reporters?: string[] };
  // prompts?: { directory?: string; pushOnBuild?: boolean };
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
