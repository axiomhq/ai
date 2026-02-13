import { AxiomWithoutBatching, datasets, type ClientOptions } from '@axiomhq/js';
import { getAuthContext } from '../auth/global-auth';
import { AxiomCLIError } from '../../util/errors';

/**
 * Gets Axiom client options from CLI options or auth context
 */
export function getAxiomClientOptions(options?: Partial<ClientOptions>): {
  token: string;
  url?: string;
  orgId?: string;
} {
  const authContext = getAuthContext();

  const token =
    options?.token || authContext?.token || process.env.AXIOM_TOKEN || process.env.AXIOM_API_TOKEN;
  const url = options?.url || authContext?.url || process.env.AXIOM_URL;
  const orgId = options?.orgId || authContext?.orgId || process.env.AXIOM_ORG_ID;

  if (!token) {
    throw new AxiomCLIError(
      'No Axiom token found. Please run `axiom auth login` or set AXIOM_TOKEN environment variable.',
    );
  }

  return {
    token,
    ...(url && { url }),
    ...(orgId && { orgId }),
  };
}

/**
 * Creates an Axiom client instance
 */
export function createAxiomClient(options?: Partial<ClientOptions>): AxiomWithoutBatching {
  const clientOptions = getAxiomClientOptions(options);
  return new AxiomWithoutBatching(clientOptions);
}

/**
 * Creates a datasets service client
 */
export function createDatasetsClient(options?: Partial<ClientOptions>): datasets.Service {
  const clientOptions = getAxiomClientOptions(options);
  return new datasets.Service(clientOptions);
}
