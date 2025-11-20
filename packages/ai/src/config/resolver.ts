import type { AxiomEvalInstrumentationOptions, ResolvedAxiomConfig } from './index';

/**
 * Builds a resources URL under the assumption that the API URL is in the format of https://api.axiom.co by replacing the subdomain with app.
 * @param urlString - The API URL
 * @returns The resources URL
 */
const buildConsoleUrl = (urlString: string) => {
  const url = new URL(urlString);

  return `${url.protocol}//app.${url.host.split('api.').at(-1)}`;
};

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
  consoleUrlOverride?: string,
): AxiomEvalInstrumentationOptions & { consoleEndpointUrl: string } {
  const consoleEndpointUrl = consoleUrlOverride ?? buildConsoleUrl(config.eval.url);

  return {
    url: config.eval.url,
    consoleEndpointUrl: consoleEndpointUrl,
    token: config.eval.token,
    dataset: config.eval.dataset,
    orgId: config.eval.orgId,
  };
}

export type AxiomConnectionResolvedConfig = ReturnType<typeof resolveAxiomConnection>;
