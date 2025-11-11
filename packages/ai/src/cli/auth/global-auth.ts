import { loadGlobalConfig, getActiveDeployment } from './config';
import { AxiomCLIError } from '../errors';
import type { Deployment } from './types';

export interface AuthContext {
  readonly deployment: Deployment;
  readonly token: string;
  readonly url: string;
  readonly orgId: string;
}

/**
 * Module-level store for auth context.
 * This provides explicit, type-safe access to auth credentials.
 */
let authContext: AuthContext | null = null;

/**
 * Gets the current auth context.
 * Returns null if auth hasn't been set up yet.
 */
export function getAuthContext(): AuthContext | null {
  return authContext;
}

/**
 * Sets up authentication context by loading config and storing it.
 *
 * @throws {AxiomCLIError} If no active deployment is found
 */
export async function setupGlobalAuth(): Promise<AuthContext> {
  const config = await loadGlobalConfig();
  const deployment = getActiveDeployment(config);

  if (!deployment) {
    throw new AxiomCLIError('No active deployment found. Run "axiom auth login" to authenticate.');
  }

  if (!deployment.token) {
    throw new AxiomCLIError(
      'No token found in active deployment. Run "axiom auth login" to authenticate.',
    );
  }

  // Store in module-level context for explicit access
  authContext = {
    deployment,
    token: deployment.token,
    url: deployment.url,
    orgId: deployment.org_id,
  };

  return authContext;
}

/**
 * Resets the auth context (useful for testing).
 */
export function resetAuthContext(): void {
  authContext = null;
}
