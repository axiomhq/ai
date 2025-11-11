import { loadGlobalConfig, getActiveDeployment } from './config';

export interface AuthContext {
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
export async function setupGlobalAuth(): Promise<AuthContext | null> {
  const config = await loadGlobalConfig();
  const deployment = getActiveDeployment(config);
  if (deployment) {
    // Store in module-level context for explicit access
    authContext = {
      token: deployment.token,
      url: deployment.url,
      orgId: deployment.org_id,
    };
  }

  return authContext;
}

/**
 * Resets the auth context (useful for testing).
 */
export function resetAuthContext(): void {
  authContext = null;
}
