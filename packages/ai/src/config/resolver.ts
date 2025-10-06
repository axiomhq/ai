import type { AxiomConfig } from './index';

/**
 * Resolved Axiom connection settings
 */
export interface ResolvedAxiomConnection {
  url: string;
  token: string | undefined;
  dataset: string;
}

/**
 * Resolve Axiom connection settings from config and environment variables.
 *
 * Priority order:
 * 1. Config values (if provided)
 * 2. Environment variables
 * 3. Defaults
 *
 * @param config - The loaded configuration (optional)
 * @returns Resolved connection settings
 */
export function resolveAxiomConnection(config?: AxiomConfig): ResolvedAxiomConnection {
  return {
    url: config?.axiom?.url ?? process.env.AXIOM_URL ?? 'https://api.axiom.co',
    token: config?.axiom?.token ?? process.env.AXIOM_TOKEN,
    dataset: config?.axiom?.dataset ?? process.env.AXIOM_DATASET ?? '',
  };
}
