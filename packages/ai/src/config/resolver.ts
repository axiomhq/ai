import type { AxiomEvalInstrumentationOptions, ResolvedAxiomConfig } from './index';

const DEFAULT_EDGE_REGION = 'us-east-1';
const NON_EDGE_HOSTS = new Set(['api.axiom.co', 'api.dev.axiomtestlabs.co']);
const LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

export function resolveEdgeRegion(edgeUrl: string): string {
  let hostname = '';

  try {
    hostname = new URL(edgeUrl).hostname.toLowerCase();
  } catch {
    return DEFAULT_EDGE_REGION;
  }

  if (NON_EDGE_HOSTS.has(hostname) || LOCALHOST_HOSTS.has(hostname)) {
    return DEFAULT_EDGE_REGION;
  }

  const [region] = hostname.split('.');
  return region ? region.toLowerCase() : DEFAULT_EDGE_REGION;
}

/**
 * Builds a resources URL under the assumption that the API URL is in the format of https://api.axiom.co by replacing the subdomain with app.
 * @param urlString - The API URL
 * @returns The resources URL
 */
const buildConsoleUrl = (urlString: string) => {
  const url = new URL(urlString);

  if (url.host.startsWith('localhost:')) {
    return urlString;
  }

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
): AxiomEvalInstrumentationOptions & { edgeRegion: string; consoleEndpointUrl: string } {
  const consoleEndpointUrl = consoleUrlOverride ?? buildConsoleUrl(config.eval.url);
  // Use edgeUrl for ingest/query operations, falling back to url if not specified
  const edgeUrl = config.eval.edgeUrl || config.eval.url;
  const edgeRegion = resolveEdgeRegion(edgeUrl);

  return {
    url: config.eval.url,
    edgeUrl,
    edgeRegion,
    consoleEndpointUrl: consoleEndpointUrl,
    token: config.eval.token,
    dataset: config.eval.dataset,
    orgId: config.eval.orgId,
  };
}

export type AxiomConnectionResolvedConfig = ReturnType<typeof resolveAxiomConnection>;
