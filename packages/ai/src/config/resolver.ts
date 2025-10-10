import type { AxiomEvalInstrumentationOptions, ResolvedAxiomConfig } from './index';

/**
 * Resolve Axiom connection settings from resolved config.
 *
 * Since the config is already resolved with defaults merged, we can directly
 * access the properties without fallback chains.
 *
 * @param config - The resolved configuration
 * @returns Resolved connection settings
 */
export function resolveAxiomConnection(
  config: ResolvedAxiomConfig,
): AxiomEvalInstrumentationOptions {
  return {
    url: config.eval.url,
    token: config.eval.token,
    dataset: config.eval.dataset,
  };
}
